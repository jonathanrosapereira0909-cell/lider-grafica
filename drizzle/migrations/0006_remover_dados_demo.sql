CREATE FUNCTION public.remover_dados_demo() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE clientes_ids uuid[]; produtos_ids uuid[]; maquinas_ids uuid[]; os_ids uuid[]; ap_ids uuid[]; orc_ids uuid[]; ped_ids uuid[]; meta record; maior bigint; inicio bigint;
BEGIN
 IF NOT public.has_role(auth.uid(),'gestor') THEN RAISE EXCEPTION 'Somente o gestor pode remover dados de demonstração'; END IF;
 LOCK TABLE public.clientes, public.produtos, public.maquinas, public.ordens_servico, public.apontamentos, public.orcamentos, public.pedidos, public.setores, public.audit_log IN EXCLUSIVE MODE;
 SELECT array_agg(id) INTO clientes_ids FROM public.clientes WHERE codigo LIKE 'DEMO-%';
 IF clientes_ids IS NULL THEN RETURN; END IF;
 SELECT array_agg(id) INTO produtos_ids FROM public.produtos WHERE codigo LIKE 'DEMO-%';
 SELECT array_agg(id) INTO maquinas_ids FROM public.maquinas WHERE codigo='DEMO-M06';
 SELECT array_agg(id) INTO os_ids FROM public.ordens_servico WHERE cliente_id=ANY(clientes_ids);
 SELECT array_agg(id) INTO ap_ids FROM public.apontamentos WHERE os_id=ANY(os_ids);
 SELECT array_agg(id) INTO orc_ids FROM public.orcamentos WHERE cliente_id=ANY(clientes_ids);
 SELECT array_agg(id) INTO ped_ids FROM public.pedidos WHERE cliente_id=ANY(clientes_ids);
 DELETE FROM public.apontamentos WHERE id=ANY(ap_ids);
 DELETE FROM public.ordens_servico WHERE id=ANY(os_ids);
 DELETE FROM public.pedidos WHERE id=ANY(ped_ids);
 DELETE FROM public.orcamentos WHERE id=ANY(orc_ids);
 DELETE FROM public.produtos WHERE id=ANY(produtos_ids);
 DELETE FROM public.maquinas WHERE id=ANY(maquinas_ids);
 DELETE FROM public.clientes WHERE id=ANY(clientes_ids);
 FOR meta IN SELECT registro_id, (depois->>'meta_diaria')::numeric AS valor FROM public.audit_log WHERE tabela='demo_meta' AND acao='meta demonstrativa' LOOP
  UPDATE public.setores SET meta_diaria=NULL WHERE id=meta.registro_id AND meta_diaria=meta.valor;
 END LOOP;
 DELETE FROM public.audit_log WHERE
 (tabela='clientes' AND registro_id=ANY(clientes_ids)) OR (tabela='produtos' AND registro_id=ANY(produtos_ids)) OR
 (tabela='maquinas' AND registro_id=ANY(maquinas_ids)) OR (tabela='ordens_servico' AND registro_id=ANY(os_ids)) OR
 (tabela='apontamentos' AND (registro_id=ANY(ap_ids) OR depois->>'os_id'=ANY(os_ids::text[]) OR antes->>'os_id'=ANY(os_ids::text[]))) OR
 (tabela='orcamentos' AND registro_id=ANY(orc_ids)) OR (tabela='pedidos' AND registro_id=ANY(ped_ids)) OR
 (tabela='demo_meta' AND acao='meta demonstrativa');
 SELECT max(numero) INTO maior FROM public.ordens_servico;
 SELECT start_value INTO inicio FROM pg_sequences WHERE schemaname='public' AND sequencename='os_numero_seq';
 PERFORM setval('public.os_numero_seq',coalesce(maior,inicio),maior IS NOT NULL);
 SELECT max(numero) INTO maior FROM public.orcamentos;
 SELECT start_value INTO inicio FROM pg_sequences WHERE schemaname='public' AND sequencename='orcamento_numero_seq';
 PERFORM setval('public.orcamento_numero_seq',coalesce(maior,inicio),maior IS NOT NULL);
 SELECT max(numero) INTO maior FROM public.pedidos;
 SELECT start_value INTO inicio FROM pg_sequences WHERE schemaname='public' AND sequencename='pedido_numero_seq';
 PERFORM setval('public.pedido_numero_seq',coalesce(maior,inicio),maior IS NOT NULL);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.remover_dados_demo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remover_dados_demo() TO authenticated;