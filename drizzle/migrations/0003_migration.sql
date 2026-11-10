create or replace function public.grant_gestor_to_anonymous()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_anonymous then
    insert into public.user_roles (user_id, role) values (new.id, 'gestor') on conflict do nothing;
  end if;
  return new;
end $$;
revoke execute on function public.grant_gestor_to_anonymous() from public, anon, authenticated;
drop trigger if exists on_anon_user_gestor on auth.users;
create trigger on_anon_user_gestor after insert on auth.users
for each row execute function public.grant_gestor_to_anonymous();