-- Create medical_reports table for storing medical documents and lab reports
create table medical_reports (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references auth.users(id) not null,
  dependent_id uuid, -- Reference to dependent if report is for a family member
  doctor_id uuid references auth.users(id), -- If uploaded by doctor, reference them
  report_type text not null, -- 'lab_report', 'imaging', 'prescription', 'pathology', 'other'
  report_title text not null,
  description text,
  file_url text not null,
  file_name text,
  file_size integer,
  mime_type text,
  extracted_data jsonb, -- OCR extracted text or structured data
  metadata jsonb, -- Additional metadata (test name, lab, etc.)
  report_date timestamp with time zone,
  is_confidential boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index medical_reports_patient_id_idx on medical_reports(patient_id);
create index medical_reports_dependent_id_idx on medical_reports(dependent_id);
create index medical_reports_doctor_id_idx on medical_reports(doctor_id);
create index medical_reports_report_type_idx on medical_reports(report_type);
create index medical_reports_report_date_idx on medical_reports(report_date);

-- Enable RLS (Row Level Security)
alter table medical_reports enable row level security;

-- Patients can upload their own reports
create policy "Patients can upload medical reports" on medical_reports
  for insert with check (auth.uid() = patient_id);

-- Doctors can upload reports for their patients
create policy "Doctors can upload reports for their patients" on medical_reports
  for insert with check (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM doctor_patient_relationships 
      WHERE doctor_id = auth.uid() 
      AND patient_id = medical_reports.patient_id
      AND is_active = true
    )
  );

-- Patients can view their own reports
create policy "Patients can view their reports" on medical_reports
  for select using (auth.uid() = patient_id);

-- Doctors can view reports for their patients
create policy "Doctors can view patient reports" on medical_reports
  for select using (
    EXISTS (
      SELECT 1 FROM doctor_patient_relationships 
      WHERE doctor_id = auth.uid() 
      AND patient_id = medical_reports.patient_id
      AND is_active = true
    )
  );

-- Patients can delete their own reports
create policy "Patients can delete their reports" on medical_reports
  for delete using (auth.uid() = patient_id);

-- Function to automatically update updated_at timestamp
create or replace function update_medical_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_medical_reports_updated_at
  before update on medical_reports
  for each row
  execute function update_medical_reports_updated_at();
