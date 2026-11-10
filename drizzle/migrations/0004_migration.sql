create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(424242);
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', nullif(split_part(coalesce(new.email,''), '@', 1), ''), 'Gestor'), new.email);
  if not exists (select 1 from public.user_roles where role = 'gestor') then
    insert into public.user_roles (user_id, role) values (new.id, 'gestor');
  end if;
  return new;
end $$;