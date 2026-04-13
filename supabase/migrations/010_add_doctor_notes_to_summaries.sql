-- Create doctor_notes table for doctor-written clinical notes
alter table doctor_summaries add column doctor_id uuid references auth.users(id);
alter table doctor_summaries add column is_doctor_written boolean default false;
alter table doctor_summaries add column consultation_date timestamp with time zone;
alter table doctor_summaries add column diagnosis text;
alter table doctor_summaries add column treatment_plan text;
alter table doctor_summaries add column follow_up_date timestamp with time zone;

-- Create indexes for doctor_written notes
create index doctor_summaries_doctor_id_idx on doctor_summaries(doctor_id);
create index doctor_summaries_is_doctor_written_idx on doctor_summaries(is_doctor_written);
create index doctor_summaries_consultation_date_idx on doctor_summaries(consultation_date);

-- RLS: Doctors can view and create notes for their patients
create policy "Doctors can create clinical notes for their patients" on doctor_summaries
  for insert with check (
    is_doctor_written = true AND 
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM doctor_patient_relationships 
      WHERE doctor_id = auth.uid() 
      AND patient_id = (SELECT user_id FROM doctor_summaries ds WHERE ds.id = doctor_summaries.id)
      AND is_active = true
    )
  );

-- Doctors can view notes for their patients
create policy "Doctors can view clinical notes for their patients" on doctor_summaries
  for select using (
    doctor_id = auth.uid() OR
    (user_id = auth.uid() AND is_doctor_written = true)
  );

-- Doctors can update their own notes
create policy "Doctors can update their own clinical notes" on doctor_summaries
  for update using (is_doctor_written = true AND doctor_id = auth.uid());

-- Patients can view doctor notes
create policy "Patients can view doctor clinical notes" on doctor_summaries
  for select using (user_id = auth.uid() AND is_doctor_written = true);
