import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, categoria:produto_categorias(nome)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produto_categorias").select("*").eq("ativo", true).order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useMaquinas() {
  return useQuery({
    queryKey: ["maquinas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("maquinas").select("*").order("codigo");
      if (error) throw error;
      return data;
    },
  });
}

export function useMotivos() {
  return useQuery({
    queryKey: ["motivos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("motivos_perda").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const [{ data: p, error }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").order("nome"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      return (p ?? []).map((u) => ({ ...u, role: r?.find((x) => x.user_id === u.id)?.role ?? null }));
    },
  });
}
