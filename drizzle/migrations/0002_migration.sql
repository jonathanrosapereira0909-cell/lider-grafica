do $$
declare t text;
begin
  foreach t in array array['profiles','user_roles','audit_log','clientes','produto_categorias','produtos','maquinas','motivos_perda','ordens_servico','apontamentos','os_lista'] loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;
revoke all on sequence public.os_numero_seq from anon, authenticated;
grant update (nome) on public.profiles to authenticated;
grant insert (codigo, nome, tipo, telefone, ativo), update (codigo, nome, tipo, telefone, ativo) on public.clientes to authenticated;
grant insert (codigo, nome, categoria_id, material, especificacao, acabamento, ativo),
      update (codigo, nome, categoria_id, material, especificacao, acabamento, ativo) on public.produtos to authenticated;
grant insert (cliente_id, produto_id, material, dimensao_modelo, acabamento, quantidade_solicitada, data_os, prazo_entrega,
              descricao_servico, observacoes, responsavel_id, valor, numero_orcamento, posicao_atual),
      update (cliente_id, produto_id, material, dimensao_modelo, acabamento, quantidade_solicitada, data_os, prazo_entrega,
              descricao_servico, observacoes, responsavel_id, valor, numero_orcamento, posicao_atual)
  on public.ordens_servico to authenticated;
grant insert (os_id, maquina_id, inicio, fim, qtd_produzida, qtd_perdida, motivo_perda_id, observacoes),
      update (maquina_id, inicio, fim, qtd_produzida, qtd_perdida, motivo_perda_id, observacoes)
  on public.apontamentos to authenticated;
revoke execute on function public.relatorio_perdas(date, date, text) from anon;
revoke execute on function public.has_role(uuid, public.app_role), public.is_member(uuid) from anon;
alter default privileges in schema public revoke all on tables from anon, authenticated;