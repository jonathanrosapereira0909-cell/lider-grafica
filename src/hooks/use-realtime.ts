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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
