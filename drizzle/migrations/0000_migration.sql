
-- ===== Roles & profiles =====
create type public.app_role as enum ('gestor', 'producao');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create policy "membros veem perfis" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_member(auth.uid()));
create policy "usuario edita proprio perfil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (nome) on public.profiles to authenticated;

create policy "ver proprio papel ou gestor" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_member(auth.uid()));

-- New user: profile + first user ever becomes gestor. Others wait for a gestor to grant access.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(424242);
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email);
  if not exists (select 1 from public.user_roles where role = 'gestor') then
    insert into public.user_roles (user_id, role) values (new.id, 'gestor');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Audit =====
create table public.audit_log (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id uuid,
  acao text not null,
  usuario_id uuid,
  em timestamptz not null default now(),
  antes jsonb,
  depois jsonb
);
create index audit_log_registro_idx on public.audit_log (tabela, registro_id, em desc);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "membros leem auditoria" on public.audit_log for select to authenticated
  using (public.is_member(auth.uid()));

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare _acao text; _id uuid;
begin
  if tg_op = 'INSERT' then
    _acao := 'criado'; _id := new.id;
    insert into public.audit_log (tabela, registro_id, acao, usuario_id, depois)
    values (tg_table_name, _id, _acao, auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    _id := new.id;
    if tg_table_name = 'ordens_servico' and old.status is distinct from new.status then
      _acao := 'status: ' || old.status || ' → ' || new.status;
    else
      _acao := 'alterado';
    end if;
    insert into public.audit_log (tabela, registro_id, acao, usuario_id, antes, depois)
    values (tg_table_name, _id, _acao, auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_log (tabela, registro_id, acao, usuario_id, antes)
    values (tg_table_name, old.id, 'excluido', auth.uid(), to_jsonb(old));
    return old;
  end if;
end $$;

create or replace function public.bump_version()
returns trigger language plpgsql set search_path = public as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end $$;

-- ===== Clientes =====
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null check (length(trim(nome)) > 0),
  tipo text not null check (tipo in ('PF','PJ')),
  telefone text,
  ativo boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);
create index clientes_nome_idx on public.clientes (lower(nome));
grant select on public.clientes to authenticated;
grant insert (codigo, nome, tipo, telefone, ativo), update (codigo, nome, tipo, telefone, ativo) on public.clientes to authenticated;
grant all on public.clientes to service_role;
alter table public.clientes enable row level security;
create policy "membros leem clientes" on public.clientes for select to authenticated using (public.is_member(auth.uid()));
create policy "gestor cria clientes" on public.clientes for insert to authenticated with check (public.has_role(auth.uid(),'gestor'));
create policy "gestor altera clientes" on public.clientes for update to authenticated using (public.has_role(auth.uid(),'gestor')) with check (public.has_role(auth.uid(),'gestor'));
create trigger clientes_version before update on public.clientes for each row execute function public.bump_version();
create trigger clientes_audit after insert or update on public.clientes for each row execute function public.audit_trigger();

-- ===== Produtos =====
create table public.produto_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem integer not null default 0,
  ativo boolean not null default true
);
grant select on public.produto_categorias to authenticated;
grant all on public.produto_categorias to service_role;
alter table public.produto_categorias enable row level security;
create policy "membros leem categorias" on public.produto_categorias for select to authenticated using (public.is_member(auth.uid()));
insert into public.produto_categorias (nome, ordem) values
  ('Etiquetas',1),('Adesivos',2),('Rótulos',3),('Cartões',4),('Folders',5),('Outros',6);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null check (length(trim(nome)) > 0),
  categoria_id uuid not null references public.produto_categorias(id),
  material text,
  especificacao text,
  acabamento text,
  ativo boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);
grant select on public.produtos to authenticated;
grant insert (codigo, nome, categoria_id, material, especificacao, acabamento, ativo),
      update (codigo, nome, categoria_id, material, especificacao, acabamento, ativo) on public.produtos to authenticated;
grant all on public.produtos to service_role;
alter table public.produtos enable row level security;
create policy "membros leem produtos" on public.produtos for select to authenticated using (public.is_member(auth.uid()));
create policy "gestor cria produtos" on public.produtos for insert to authenticated with check (public.has_role(auth.uid(),'gestor'));
create policy "gestor altera produtos" on public.produtos for update to authenticated using (public.has_role(auth.uid(),'gestor')) with check (public.has_role(auth.uid(),'gestor'));
create trigger produtos_version before update on public.produtos for each row execute function public.bump_version();
create trigger produtos_audit after insert or update on public.produtos for each row execute function public.audit_trigger();

-- ===== Máquinas & motivos =====
create table public.maquinas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  ativo boolean not null default true
);
grant select on public.maquinas to authenticated;
grant all on public.maquinas to service_role;
alter table public.maquinas enable row level security;
create policy "membros leem maquinas" on public.maquinas for select to authenticated using (public.is_member(auth.uid()));
insert into public.maquinas (codigo, nome) values
  ('M01','Impressora Flexográfica 5 cores'),
  ('M02','Impressora Ricoh Digital'),
  ('M03','Plotter de recorte de folha A3-A4 (acabamento Ricoh)'),
  ('M04','Impressora de etiqueta'),
  ('M05','Rebobinadeira (acabamento da flexo)');

create table public.motivos_perda (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);
grant select on public.motivos_perda to authenticated;
grant all on public.motivos_perda to service_role;
alter table public.motivos_perda enable row level security;
create policy "membros leem motivos" on public.motivos_perda for select to authenticated using (public.is_member(auth.uid()));
insert into public.motivos_perda (nome) values ('Erro de impressão'),('Corte errado'),('Acerto de máquinas');

-- ===== Ordens de serviço =====
create type public.os_status as enum (
  'aguardando_producao','em_producao','producao_finalizada','faturado',
  'aguardando_entrega','entregue','finalizado','cancelado'
);

create sequence public.os_numero_seq start with 1964 minvalue 1 no cycle;

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null unique,
  cliente_id uuid not null references public.clientes(id),
  produto_id uuid not null references public.produtos(id),
  -- snapshot of the product at creation time (history must never change retroactively)
  produto_codigo text not null,
  produto_nome text not null,
  produto_categoria text not null,
  material text,
  dimensao_modelo text,
  acabamento text,
  quantidade_solicitada numeric(14,2) not null check (quantidade_solicitada > 0),
  data_os date not null default current_date,
  prazo_entrega date,
  descricao_servico text,
  observacoes text,
  responsavel_id uuid references public.profiles(id),
  valor numeric(14,2) check (valor is null or valor >= 0),
  numero_orcamento text,
  posicao_atual text,
  status public.os_status not null default 'aguardando_producao',
  quantidade_faturada numeric(14,2),
  faturado_em timestamptz, faturado_por uuid,
  liberado_entrega_em timestamptz, liberado_entrega_por uuid,
  data_entrega timestamptz, entregue_por text, recebido_por text, observacao_entrega text, expedido_registrado_por uuid,
  finalizado_em timestamptz, finalizado_por uuid,
  producao_finalizada_em timestamptz, producao_finalizada_por uuid,
  cancelado_em timestamptz, cancelado_por uuid, motivo_cancelamento text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);
create index os_status_idx on public.ordens_servico (status);
create index os_cliente_idx on public.ordens_servico (cliente_id);
create index os_produto_idx on public.ordens_servico (produto_id);
create index os_prazo_idx on public.ordens_servico (prazo_entrega);
create index os_responsavel_idx on public.ordens_servico (responsavel_id);
create index os_data_idx on public.ordens_servico (data_os);

grant select on public.ordens_servico to authenticated;
grant insert (cliente_id, produto_id, material, dimensao_modelo, acabamento, quantidade_solicitada, data_os, prazo_entrega,
              descricao_servico, observacoes, responsavel_id, valor, numero_orcamento, posicao_atual),
      update (cliente_id, produto_id, material, dimensao_modelo, acabamento, quantidade_solicitada, data_os, prazo_entrega,
              descricao_servico, observacoes, responsavel_id, valor, numero_orcamento, posicao_atual)
  on public.ordens_servico to authenticated;
grant all on public.ordens_servico to service_role;
alter table public.ordens_servico enable row level security;
create policy "membros leem OS" on public.ordens_servico for select to authenticated using (public.is_member(auth.uid()));
create policy "gestor cria OS" on public.ordens_servico for insert to authenticated with check (public.has_role(auth.uid(),'gestor'));
create policy "gestor altera OS" on public.ordens_servico for update to authenticated using (public.has_role(auth.uid(),'gestor')) with check (public.has_role(auth.uid(),'gestor'));

create or replace function public.os_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare _p record; _c record;
begin
  select * into _c from public.clientes where id = new.cliente_id;
  if not found or not _c.ativo then raise exception 'Cliente inativo ou inexistente'; end if;
  select p.*, c.nome as cat into _p from public.produtos p join public.produto_categorias c on c.id = p.categoria_id where p.id = new.produto_id;
  if not found or not _p.ativo then raise exception 'Produto inativo ou inexistente'; end if;
  new.numero := nextval('public.os_numero_seq');
  new.status := 'aguardando_producao';
  new.produto_codigo := _p.codigo;
  new.produto_nome := _p.nome;
  new.produto_categoria := _p.cat;
  new.created_by := auth.uid();
  new.created_at := now();
  new.version := 1;
  return new;
end $$;
create trigger os_before_insert before insert on public.ordens_servico for each row execute function public.os_before_insert();

create or replace function public.os_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare _p record; _c record;
begin
  if new.numero <> old.numero then raise exception 'O número da OS não pode ser alterado'; end if;
  if old.status in ('finalizado','cancelado') then raise exception 'OS % está % e não pode ser alterada', old.numero, old.status; end if;
  if new.cliente_id <> old.cliente_id then
    select * into _c from public.clientes where id = new.cliente_id;
    if not found or not _c.ativo then raise exception 'Cliente inativo ou inexistente'; end if;
  end if;
  if new.produto_id <> old.produto_id then
    select p.*, c.nome as cat into _p from public.produtos p join public.produto_categorias c on c.id = p.categoria_id where p.id = new.produto_id;
    if not found or not _p.ativo then raise exception 'Produto inativo ou inexistente'; end if;
    new.produto_codigo := _p.codigo; new.produto_nome := _p.nome; new.produto_categoria := _p.cat;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end $$;
create trigger os_before_update before update on public.ordens_servico for each row execute function public.os_before_update();
create trigger os_audit after insert or update on public.ordens_servico for each row execute function public.audit_trigger();

-- ===== Apontamentos de produção =====
create table public.apontamentos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id),
  usuario_id uuid not null references public.profiles(id),
  maquina_id uuid not null references public.maquinas(id),
  inicio timestamptz not null,
  fim timestamptz,
  qtd_produzida numeric(14,2) not null default 0 check (qtd_produzida >= 0),
  qtd_perdida numeric(14,2) not null default 0 check (qtd_perdida >= 0),
  motivo_perda_id uuid references public.motivos_perda(id),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  check (fim is null or fim >= inicio),
  check (qtd_perdida = 0 or motivo_perda_id is not null)
);
create index apont_os_idx on public.apontamentos (os_id);
create index apont_maquina_idx on public.apontamentos (maquina_id, inicio);
create index apont_usuario_idx on public.apontamentos (usuario_id, inicio);
create index apont_inicio_idx on public.apontamentos (inicio);
grant select on public.apontamentos to authenticated;
grant insert (os_id, maquina_id, inicio, fim, qtd_produzida, qtd_perdida, motivo_perda_id, observacoes),
      update (maquina_id, inicio, fim, qtd_produzida, qtd_perdida, motivo_perda_id, observacoes)
  on public.apontamentos to authenticated;
grant all on public.apontamentos to service_role;
alter table public.apontamentos enable row level security;
create policy "membros leem apontamentos" on public.apontamentos for select to authenticated using (public.is_member(auth.uid()));
create policy "membros registram apontamento" on public.apontamentos for insert to authenticated
  with check (public.is_member(auth.uid()) and usuario_id = auth.uid());
create policy "autor ou gestor altera apontamento" on public.apontamentos for update to authenticated
  using (usuario_id = auth.uid() or public.has_role(auth.uid(),'gestor'))
  with check (usuario_id = auth.uid() or public.has_role(auth.uid(),'gestor'));

create or replace function public.apont_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare _st public.os_status;
begin
  new.usuario_id := auth.uid();
  select status into _st from public.ordens_servico where id = new.os_id for update;
  if _st is null then raise exception 'OS inexistente'; end if;
  if _st not in ('aguardando_producao','em_producao') then
    raise exception 'Só é possível apontar produção em OS aguardando ou em produção';
  end if;
  return new;
end $$;
create trigger apont_before_insert before insert on public.apontamentos for each row execute function public.apont_before_insert();

create or replace function public.apont_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.ordens_servico set status = 'em_producao' where id = new.os_id and status = 'aguardando_producao';
  return new;
end $$;
create trigger apont_after_insert after insert on public.apontamentos for each row execute function public.apont_after_insert();

create or replace function public.apont_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare _st public.os_status;
begin
  select status into _st from public.ordens_servico where id = new.os_id;
  if _st not in ('aguardando_producao','em_producao','producao_finalizada') then
    raise exception 'Apontamentos não podem ser alterados após o faturamento';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end $$;
create trigger apont_before_update before update on public.apontamentos for each row execute function public.apont_before_update();
create trigger apont_audit after insert or update on public.apontamentos for each row execute function public.audit_trigger();

-- ===== OS status transitions (only path to change status) =====
create or replace function public._os_transicao(_id uuid, _de public.os_status[], _para public.os_status)
returns public.ordens_servico language plpgsql security definer set search_path = public as $$
declare _os public.ordens_servico;
begin
  select * into _os from public.ordens_servico where id = _id for update;
  if not found then raise exception 'OS não encontrada'; end if;
  if not (_os.status = any(_de)) then
    raise exception 'A OS % está em "%" e não pode ir para "%"', _os.numero, _os.status, _para;
  end if;
  return _os;
end $$;
revoke execute on function public._os_transicao(uuid, public.os_status[], public.os_status) from public, anon, authenticated;

create or replace function public.os_finalizar_producao(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member(auth.uid()) then raise exception 'Sem permissão'; end if;
  perform public._os_transicao(_id, array['em_producao']::public.os_status[], 'producao_finalizada');
  if not exists (select 1 from public.apontamentos where os_id = _id) then
    raise exception 'Registre ao menos um apontamento antes de finalizar a produção';
  end if;
  update public.ordens_servico set status = 'producao_finalizada', producao_finalizada_em = now(), producao_finalizada_por = auth.uid() where id = _id;
end $$;

create or replace function public.os_faturar(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _total numeric;
begin
  if not public.has_role(auth.uid(),'gestor') then raise exception 'Somente o gestor pode faturar'; end if;
  perform public._os_transicao(_id, array['producao_finalizada']::public.os_status[], 'faturado');
  select coalesce(sum(qtd_produzida),0) into _total from public.apontamentos where os_id = _id;
  if _total <= 0 then raise exception 'Não há quantidade produzida para faturar'; end if;
  update public.ordens_servico set status = 'faturado', quantidade_faturada = _total, faturado_em = now(), faturado_por = auth.uid() where id = _id;
end $$;

create or replace function public.os_liberar_entrega(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member(auth.uid()) then raise exception 'Sem permissão'; end if;
  perform public._os_transicao(_id, array['faturado']::public.os_status[], 'aguardando_entrega');
  update public.ordens_servico set status = 'aguardando_entrega', liberado_entrega_em = now(), liberado_entrega_por = auth.uid() where id = _id;
end $$;

create or replace function public.os_expedir(_id uuid, _data_entrega timestamptz, _entregue_por text, _recebido_por text, _observacao text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member(auth.uid()) then raise exception 'Sem permissão'; end if;
  if _data_entrega is null then raise exception 'Informe a data da entrega'; end if;
  if coalesce(trim(_entregue_por),'') = '' then raise exception 'Informe o responsável pela entrega'; end if;
  if coalesce(trim(_recebido_por),'') = '' then raise exception 'Informe quem recebeu'; end if;
  perform public._os_transicao(_id, array['aguardando_entrega']::public.os_status[], 'entregue');
  update public.ordens_servico set status = 'entregue', data_entrega = _data_entrega, entregue_por = trim(_entregue_por),
    recebido_por = trim(_recebido_por), observacao_entrega = nullif(trim(_observacao),''), expedido_registrado_por = auth.uid() where id = _id;
end $$;

create or replace function public.os_baixar(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'gestor') then raise exception 'Somente o gestor pode baixar a OS'; end if;
  perform public._os_transicao(_id, array['entregue']::public.os_status[], 'finalizado');
  update public.ordens_servico set status = 'finalizado', finalizado_em = now(), finalizado_por = auth.uid() where id = _id;
end $$;

create or replace function public.os_cancelar(_id uuid, _motivo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'gestor') then raise exception 'Somente o gestor pode cancelar uma OS'; end if;
  if coalesce(length(trim(_motivo)),0) < 3 then raise exception 'O motivo do cancelamento é obrigatório'; end if;
  perform public._os_transicao(_id, array['aguardando_producao','em_producao','producao_finalizada','faturado','aguardando_entrega','entregue']::public.os_status[], 'cancelado');
  update public.ordens_servico set status = 'cancelado', cancelado_em = now(), cancelado_por = auth.uid(), motivo_cancelamento = trim(_motivo) where id = _id;
end $$;

revoke execute on function public.os_finalizar_producao(uuid), public.os_faturar(uuid), public.os_liberar_entrega(uuid),
  public.os_expedir(uuid, timestamptz, text, text, text), public.os_baixar(uuid), public.os_cancelar(uuid, text) from public, anon;
grant execute on function public.os_finalizar_producao(uuid), public.os_faturar(uuid), public.os_liberar_entrega(uuid),
  public.os_expedir(uuid, timestamptz, text, text, text), public.os_baixar(uuid), public.os_cancelar(uuid, text) to authenticated;

-- ===== User role management (gestor only) =====
create or replace function public.definir_papel(_user_id uuid, _role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'gestor') then raise exception 'Somente o gestor gerencia usuários'; end if;
  perform pg_advisory_xact_lock(424242);
  if public.has_role(_user_id,'gestor') and (_role is null or _role <> 'gestor')
     and (select count(*) from public.user_roles where role = 'gestor') <= 1 then
    raise exception 'É necessário manter ao menos um gestor';
  end if;
  insert into public.audit_log (tabela, registro_id, acao, usuario_id, antes, depois)
  values ('user_roles', _user_id, 'papel: ' || coalesce(_role::text,'sem acesso'), auth.uid(),
    (select jsonb_agg(role) from public.user_roles where user_id = _user_id), to_jsonb(_role));
  delete from public.user_roles where user_id = _user_id;
  if _role is not null then insert into public.user_roles (user_id, role) values (_user_id, _role); end if;
end $$;
revoke execute on function public.definir_papel(uuid, public.app_role) from public, anon;
grant execute on function public.definir_papel(uuid, public.app_role) to authenticated;

-- ===== List view (RLS of caller applies) =====
create view public.os_lista with (security_invoker = true) as
select o.*,
  c.nome as cliente_nome, c.codigo as cliente_codigo,
  r.nome as responsavel_nome,
  coalesce(a.total_produzido,0) as total_produzido,
  coalesce(a.total_perdido,0) as total_perdido,
  a.data_inicial,
  coalesce(a.maquina_ids, '{}') as maquina_ids,
  (o.prazo_entrega is not null and o.prazo_entrega < current_date
     and o.status not in ('entregue','finalizado','cancelado')) as atrasada
from public.ordens_servico o
join public.clientes c on c.id = o.cliente_id
left join public.profiles r on r.id = o.responsavel_id
left join lateral (
  select sum(qtd_produzida) total_produzido, sum(qtd_perdida) total_perdido, min(inicio) data_inicial,
         array_agg(distinct maquina_id) maquina_ids
  from public.apontamentos ap where ap.os_id = o.id
) a on true;
grant select on public.os_lista to authenticated;

-- ===== Loss report (RLS applies) =====
create or replace function public.relatorio_perdas(_inicio date, _fim date, _agrupar text)
returns table (periodo date, maquina text, motivo text, produzido numeric, perdido numeric, apontamentos bigint)
language sql stable security invoker set search_path = public as $$
  select date_trunc(case when _agrupar in ('day','week','month','year') then _agrupar else 'month' end, a.inicio)::date,
         m.codigo || ' — ' || m.nome, coalesce(mp.nome, '—'),
         sum(a.qtd_produzida), sum(a.qtd_perdida), count(*)
  from public.apontamentos a
  join public.maquinas m on m.id = a.maquina_id
  left join public.motivos_perda mp on mp.id = a.motivo_perda_id
  where a.inicio >= _inicio and a.inicio < (_fim + 1)
  group by 1,2,3 order by 1 desc, 2, 3
$$;
grant execute on function public.relatorio_perdas(date, date, text) to authenticated;

alter publication supabase_realtime add table public.ordens_servico, public.apontamentos, public.clientes, public.produtos;
