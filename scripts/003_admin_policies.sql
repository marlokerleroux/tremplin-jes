-- Create admin role check function
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return (
    select coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      false
    )
  );
end;
$$;

-- Admin policies for viewing all applications
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can view all applications"
  on public.applications for select
  using (public.is_admin());

create policy "Admins can update all applications"
  on public.applications for update
  using (public.is_admin());

create policy "Admins can view all technical sheets"
  on public.technical_sheets for select
  using (public.is_admin());
