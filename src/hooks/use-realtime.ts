import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Keeps every open screen in sync with changes made by other users. */
export function useRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`sync-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ordens_servico" }, () => {
        qc.invalidateQueries({ queryKey: ["os"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "apontamentos" }, () => {
        qc.invalidateQueries({ queryKey: ["os"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, () => {
        qc.invalidateQueries({ queryKey: ["clientes"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "produtos" }, () => {
        qc.invalidateQueries({ queryKey: ["produtos"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orcamentos" }, () => {
        qc.invalidateQueries({ queryKey: ["os", "dashboard"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
        qc.invalidateQueries({ queryKey: ["os", "dashboard"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "setores" }, () => {
        qc.invalidateQueries({ queryKey: ["os", "dashboard"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
