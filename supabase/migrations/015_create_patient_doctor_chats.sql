-- Create patient_doctor_chats table for managing chat sessions
create table patient_doctor_chats (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references auth.users(id) not null,
  doctor_id uuid references auth.users(id) not null,
  status text default 'active', -- active, closed, archived
  reason_for_consultation text,
  patient_request_message text,
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  doctor_accepted_at timestamp with time zone,
  consultation_complete_at timestamp with time zone,
  doctor_notes text,
  patient_satisfaction_rating integer check (patient_satisfaction_rating >= 1 and patient_satisfaction_rating <= 5),
  doctor_summary text,
  follow_up_required boolean default false,
  follow_up_date timestamp with time zone,
  is_pinned boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index patient_doctor_chats_patient_id_idx on patient_doctor_chats(patient_id);
create index patient_doctor_chats_doctor_id_idx on patient_doctor_chats(doctor_id);
create index patient_doctor_chats_status_idx on patient_doctor_chats(status);
create index patient_doctor_chats_created_at_idx on patient_doctor_chats(created_at);

-- Enable RLS
alter table patient_doctor_chats enable row level security;

-- Patients can view their own chats
create policy "Patients can view their own chats" on patient_doctor_chats
  for select using (auth.uid() = patient_id);

-- Patients can create chats
create policy "Patients can create chats" on patient_doctor_chats
  for insert with check (auth.uid() = patient_id);

-- Patients can update their own chats
create policy "Patients can update their own chats" on patient_doctor_chats
  for update using (auth.uid() = patient_id);

-- Doctors can view chats with their patients
create policy "Doctors can view their patient chats" on patient_doctor_chats
  for select using (auth.uid() = doctor_id);

-- Doctors can update chats (accept, add notes, close)
create policy "Doctors can update their chats" on patient_doctor_chats
  for update using (auth.uid() = doctor_id);

-- Function to automatically update updated_at timestamp
create or replace function update_patient_doctor_chats_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_patient_doctor_chats_updated_at
  before update on patient_doctor_chats
  for each row
  execute function update_patient_doctor_chats_updated_at();
