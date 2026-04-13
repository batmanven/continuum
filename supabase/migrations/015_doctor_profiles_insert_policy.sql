-- Add missing INSERT policy for doctor_profiles
create policy "Doctors can insert their own profile" on doctor_profiles
  for insert with check (auth.uid() = user_id);
