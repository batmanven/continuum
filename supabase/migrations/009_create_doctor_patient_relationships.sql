-- Create doctor_patient_relationships table for managing access permissions
create table doctor_patient_relationships (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references auth.users(id) not null,
  patient_id uuid references auth.users(id) not null,
  dependent_id uuid, -- If accessing a dependent's record, reference their profile
  access_granted_at timestamp with time zone default now(),
  access_revoked_at timestamp with time zone,
  is_active boolean default true,
  relationship_type text default 'primary_care', -- primary_care, specialist, consultation, etc.
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Composite unique constraint (doctor can have only one active relationship per patient)
create unique index doctor_patient_unique_idx on doctor_patient_relationships(doctor_id, patient_id, dependent_id) 
  where is_active = true;

-- Create indexes for better performance
create index doctor_patient_relationships_doctor_id_idx on doctor_patient_relationships(doctor_id);
create index doctor_patient_relationships_patient_id_idx on doctor_patient_relationships(patient_id);
create index doctor_patient_relationships_is_active_idx on doctor_patient_relationships(is_active);

-- Enable RLS (Row Level Security)
alter table doctor_patient_relationships enable row level security;

-- Doctors can view their own patient relationships
create policy "Doctors can view their patients" on doctor_patient_relationships
  for select using (auth.uid() = doctor_id);

-- Doctors can create relationships (hospital will verify)
create policy "Doctors can create patient relationships" on doctor_patient_relationships
  for insert with check (auth.uid() = doctor_id);

-- Doctors can revoke their own relationships
create policy "Doctors can revoke relationships" on doctor_patient_relationships
  for update using (auth.uid() = doctor_id);

-- Patients can view doctors they've granted access to
create policy "Patients can view their doctors" on doctor_patient_relationships
  for select using (auth.uid() = patient_id and is_active = true);

-- Function to automatically update updated_at timestamp
create or replace function update_doctor_patient_relationships_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_doctor_patient_relationships_updated_at
  before update on doctor_patient_relationships
  for each row
  execute function update_doctor_patient_relationships_updated_at();
