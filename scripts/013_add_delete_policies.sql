-- Add DELETE policies for applications and technical_sheets

-- Allow users to delete their own applications if not validated
create policy "Users can delete their own non-validated applications"
  on public.applications for delete
  using (
    auth.uid() = user_id 
    and status != 'validated'
  );

-- Allow users to delete their own technical sheets
create policy "Users can delete their own technical sheets"
  on public.technical_sheets for delete
  using (
    exists (
      select 1 from public.applications
      where applications.id = technical_sheets.application_id
      and applications.user_id = auth.uid()
      and applications.status != 'validated'
    )
  );

-- Allow admins to delete any application
create policy "Admins can delete any application"
  on public.applications for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Allow admins to delete any technical sheet
create policy "Admins can delete any technical sheet"
  on public.technical_sheets for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
