-- Extend doctor_profiles with verification and availability fields
alter table doctor_profiles add column verification_status text default 'pending'; -- pending, verified, rejected
alter table doctor_profiles add column verified_by text; -- 'site' or 'hospital'
alter table doctor_profiles add column verification_date timestamp with time zone;
alter table doctor_profiles add column rejection_reason text;
alter table doctor_profiles add column accepting_patients boolean default false;
alter table doctor_profiles add column consultation_fee_usd numeric;
alter table doctor_profiles add column average_rating numeric default 0;
alter table doctor_profiles add column total_consultations integer default 0;

-- Create index for verification status
create index if not exists doctor_profiles_verification_status_idx on doctor_profiles(verification_status);
create index if not exists doctor_profiles_accepting_patients_idx on doctor_profiles(accepting_patients);
-- Specialty index is already created in 008_create_doctor_profiles.sql
-- create index if not exists doctor_profiles_specialty_idx on doctor_profiles(specialty);
