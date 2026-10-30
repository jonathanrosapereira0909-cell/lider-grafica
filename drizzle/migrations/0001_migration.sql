create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare _acao text := 'alterado';
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (tabela, registro_id, acao, usuario_id, depois)
    values (tg_table_name, new.id, 'criado', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    if tg_table_name = 'ordens_servico' and (to_jsonb(old)->>'status') is distinct from (to_jsonb(new)->>'status') then
      _acao := 'status: ' || (to_jsonb(old)->>'status') || ' → ' || (to_jsonb(new)->>'status');
    end if;
    insert into public.audit_log (tabela, registro_id, acao, usuario_id, antes, depois)
    values (tg_table_name, new.id, _acao, auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  end if;
  return old;
end $$;