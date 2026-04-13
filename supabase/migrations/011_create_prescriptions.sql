-- Create prescriptions table for doctor-written prescriptions
create table prescriptions (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references auth.users(id) not null,
  patient_id uuid references auth.users(id) not null,
  dependent_id uuid, -- Reference to dependent if prescribed for a family member
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  instructions text,
  reason_for_prescription text,
  prescribed_date timestamp with time zone default now(),
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  refills_allowed integer default 0,
  refills_remaining integer default 0,
  is_active boolean default true,
  patient_acknowledged boolean default false,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index prescriptions_doctor_id_idx on prescriptions(doctor_id);
create index prescriptions_patient_id_idx on prescriptions(patient_id);
create index prescriptions_dependent_id_idx on prescriptions(dependent_id);
create index prescriptions_is_active_idx on prescriptions(is_active);
create index prescriptions_prescribed_date_idx on prescriptions(prescribed_date);

-- Enable RLS (Row Level Security)
alter table prescriptions enable row level security;

-- Doctors can create and view their own prescriptions
create policy "Doctors can create prescriptions for their patients" on prescriptions
  for insert with check (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM doctor_patient_relationships 
      WHERE doctor_id = auth.uid() 
      AND patient_id = prescriptions.patient_id
      AND is_active = true
    )
  );

create policy "Doctors can view their prescriptions" on prescriptions
  for select using (auth.uid() = doctor_id);

-- Doctors can update their prescriptions
create policy "Doctors can update their prescriptions" on prescriptions
  for update using (auth.uid() = doctor_id);

-- Patients can view prescriptions written for them
create policy "Patients can view their prescriptions" on prescriptions
  for select using (auth.uid() = patient_id);

-- Patients can acknowledge prescriptions
create policy "Patients can acknowledge prescriptions" on prescriptions
  for update using (auth.uid() = patient_id);

-- Function to automatically update updated_at timestamp
create or replace function update_prescriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_prescriptions_updated_at
  before update on prescriptions
  for each row
  execute function update_prescriptions_updated_at();
