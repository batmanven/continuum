-- Create consultation_records table for doctor-patient consultations
create table consultation_records (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references auth.users(id) not null,
  patient_id uuid references auth.users(id) not null,
  dependent_id uuid, -- Reference to dependent if consultation is for a family member
  consultation_type text default 'general', -- 'general', 'follow_up', 'emergency', 'specialist', etc.
  consultation_date timestamp with time zone not null,
  duration_minutes integer,
  chief_complaint text,
  clinical_findings text,
  diagnosis text,
  treatment_plan text,
  tests_ordered text[],
  medications_prescribed text[],
  follow_up_date timestamp with time zone,
  follow_up_instructions text,
  notes text,
  consultation_mode text default 'in_person', -- 'in_person', 'video', 'phone', 'chat'
  is_completed boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index consultation_records_doctor_id_idx on consultation_records(doctor_id);
create index consultation_records_patient_id_idx on consultation_records(patient_id);
create index consultation_records_consultation_date_idx on consultation_records(consultation_date);
create index consultation_records_dependent_id_idx on consultation_records(dependent_id);

-- Enable RLS (Row Level Security)
alter table consultation_records enable row level security;

-- Doctors can create consultation records for their patients
create policy "Doctors can create consultation records" on consultation_records
  for insert with check (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM doctor_patient_relationships 
      WHERE doctor_id = auth.uid() 
      AND patient_id = consultation_records.patient_id
      AND is_active = true
    )
  );

-- Doctors can view consultation records for their patients
create policy "Doctors can view consultation records" on consultation_records
  for select using (auth.uid() = doctor_id);

-- Doctors can update their consultation records
create policy "Doctors can update consultation records" on consultation_records
  for update using (auth.uid() = doctor_id);

-- Patients can view their consultation records
create policy "Patients can view their consultation records" on consultation_records
  for select using (auth.uid() = patient_id);

-- Function to automatically update updated_at timestamp
create or replace function update_consultation_records_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_consultation_records_updated_at
  before update on consultation_records
  for each row
  execute function update_consultation_records_updated_at();
