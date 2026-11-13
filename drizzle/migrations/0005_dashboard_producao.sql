CREATE TABLE public.setores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE, meta_diaria numeric CHECK (meta_diaria >= 0), ordem integer NOT NULL DEFAULT 0, ativo boolean NOT NULL DEFAULT true);
GRANT SELECT, INSERT ON public.setores TO authenticated;
GRANT UPDATE (nome, meta_diaria) ON public.setores TO authenticated;
GRANT ALL ON public.setores TO service_role;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membros leem setores" ON public.setores FOR SELECT TO authenticated USING (public.is_member(auth.uid()));
CREATE POLICY "gestor cria setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'gestor'));
CREATE POLICY "gestor altera metas e nomes" ON public.setores FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'gestor')) WITH CHECK (public.has_role(auth.uid(),'gestor'));
ALTER TABLE public.maquinas ADD COLUMN setor_id uuid REFERENCES public.setores(id);
CREATE SEQUENCE public.orcamento_numero_seq;
CREATE TABLE public.orcamentos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), numero bigint NOT NULL UNIQUE DEFAULT nextval('public.orcamento_numero_seq'), cliente_id uuid NOT NULL REFERENCES public.clientes(id), descricao text, valor numeric NOT NULL DEFAULT 0 CHECK (valor >= 0), status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','aprovado','recusado')), created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
GRANT USAGE ON SEQUENCE public.orcamento_numero_seq TO authenticated, service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membros leem orcamentos" ON public.orcamentos FOR SELECT TO authenticated USING (public.is_member(auth.uid()));
CREATE POLICY "gestor cria orcamentos" ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'gestor'));
CREATE POLICY "gestor altera orcamentos" ON public.orcamentos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'gestor')) WITH CHECK (public.has_role(auth.uid(),'gestor'));
CREATE TRIGGER orcamentos_audit AFTER INSERT OR UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE SEQUENCE public.pedido_numero_seq;
CREATE TABLE public.pedidos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), numero bigint NOT NULL UNIQUE DEFAULT nextval('public.pedido_numero_seq'), orcamento_id uuid REFERENCES public.orcamentos(id), cliente_id uuid NOT NULL REFERENCES public.clientes(id), descricao text, valor numeric NOT NULL DEFAULT 0 CHECK (valor >= 0), status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','convertido_os','cancelado')), created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
GRANT USAGE ON SEQUENCE public.pedido_numero_seq TO authenticated, service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membros leem pedidos" ON public.pedidos FOR SELECT TO authenticated USING (public.is_member(auth.uid()));
CREATE POLICY "gestor cria pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'gestor'));
CREATE POLICY "gestor altera pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'gestor')) WITH CHECK (public.has_role(auth.uid(),'gestor'));
CREATE TRIGGER pedidos_audit AFTER INSERT OR UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE FUNCTION public.dashboard_producao(_dia date) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO public AS $$
WITH contagem AS (
 SELECT count(*) FILTER (WHERE status NOT IN ('finalizado','cancelado')) AS abertas,
 count(*) FILTER (WHERE status='aguardando_producao') AS aguardando_producao,
 count(*) FILTER (WHERE status='em_producao') AS produzindo,
 count(*) FILTER (WHERE status='producao_finalizada') AS aguardando_faturamento,
 count(*) FILTER (WHERE status IN ('faturado','aguardando_entrega')) AS expedicao,
 count(*) FILTER (WHERE status='entregue') AS outros FROM public.ordens_servico
), por_maquina AS (
 SELECT m.id,m.codigo,m.nome,m.setor_id,coalesce(sum(a.qtd_produzida),0) AS produzido,coalesce(sum(a.qtd_perdida),0) AS perdido
 FROM public.maquinas m LEFT JOIN public.apontamentos a ON a.maquina_id=m.id
 AND a.inicio >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
 AND a.inicio < ((_dia+1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
 GROUP BY m.id,m.codigo,m.nome,m.setor_id
), por_setor AS (
 SELECT s.id,s.nome,s.ordem,s.meta_diaria,coalesce(sum(m.produzido),0) AS produzido,coalesce(sum(m.perdido),0) AS perdido,
 coalesce(jsonb_agg(jsonb_build_object('id',m.id,'codigo',m.codigo,'nome',m.nome,'produzido',m.produzido,'perdido',m.perdido) ORDER BY m.codigo) FILTER (WHERE m.id IS NOT NULL),'[]'::jsonb) AS maquinas
 FROM public.setores s LEFT JOIN por_maquina m ON m.setor_id=s.id WHERE s.ativo GROUP BY s.id,s.nome,s.ordem,s.meta_diaria
), recentes AS (
 SELECT id,numero,cliente_nome,produto_nome,quantidade_solicitada,status,prazo_entrega FROM public.os_lista WHERE status <> 'cancelado' ORDER BY created_at DESC,id LIMIT 5
)
SELECT jsonb_build_object(
 'orcamentos_abertos',(SELECT jsonb_build_object('qtd',count(*),'valor',coalesce(sum(valor),0)) FROM public.orcamentos WHERE status='aberto'),
 'pedidos_abertos',(SELECT jsonb_build_object('qtd',count(*),'valor',coalesce(sum(valor),0)) FROM public.pedidos WHERE status='aberto'),
 'status',(SELECT to_jsonb(c) FROM contagem c),
 'setores',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.ordem) FROM por_setor s),'[]'::jsonb),
 'recentes',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM recentes r),'[]'::jsonb));
$$;
REVOKE EXECUTE ON FUNCTION public.dashboard_producao(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_producao(date) TO authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE public.setores, public.orcamentos, public.pedidos;