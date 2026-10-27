import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/os";

export type Me = {
  id: string;
  email: string | null;
  nome: string;
  roles: AppRole[];
  isGestor: boolean;
  isMember: boolean;
};

export const meQueryKey = ["me"] as const;

export async function fetchMe(): Promise<Me | null> {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) return null;
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle(),
  ]);
  const r = (roles ?? []).map((x) => x.role);
  return {
    id: user.id,
    email: user.email ?? null,
    nome: profile?.nome || user.email || "",
    roles: r,
    isGestor: r.includes("gestor"),
    isMember: r.length > 0,
  };
}

/** UI hint only — every rule is enforced again by the database. */
export function useMe() {
  return useQuery({ queryKey: meQueryKey, queryFn: fetchMe, staleTime: 60_000 });
}
