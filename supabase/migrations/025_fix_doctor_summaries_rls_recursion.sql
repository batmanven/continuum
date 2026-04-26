-- Fix infinite recursion in doctor_summaries RLS policy
-- The "Doctors can create clinical notes for their patients" policy had a self-referencing
-- subquery: SELECT user_id FROM doctor_summaries ... inside an RLS policy on doctor_summaries.
-- This caused Supabase to report "infinite recursion detected in policy for relation doctor_summaries".
-- Fix: use the row's own user_id column directly instead of a subquery.

drop policy if exists "Doctors can create clinical notes for their patients" on doctor_summaries;

create policy "Doctors can create clinical notes for their patients" on doctor_summaries
  for insert with check (
    is_doctor_written = true AND 
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM doctor_patient_relationships 
      WHERE doctor_id = auth.uid() 
      AND patient_id = doctor_summaries.user_id
      AND is_active = true
    )
  );
