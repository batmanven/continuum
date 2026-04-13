-- Create doctor_profiles table for doctor account information
create table doctor_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null unique,
  full_name text not null,
  medical_license text not null,
  license_country text,
  specialty text not null,
  hospital_id text, -- Reference to hospital managing this doctor
  hospital_name text,
  verified_by_hospital boolean default false,
  hospital_verified_at timestamp with time zone,
  qualification text,
  experience_years integer,
  contact_number text,
  profile_image_url text,
  bio text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index doctor_profiles_user_id_idx on doctor_profiles(user_id);
create index doctor_profiles_hospital_id_idx on doctor_profiles(hospital_id);
create index doctor_profiles_specialty_idx on doctor_profiles(specialty);

-- Enable RLS (Row Level Security)
alter table doctor_profiles enable row level security;

-- Doctors can view their own profile
create policy "Doctors can view their own profile" on doctor_profiles
  for select using (auth.uid() = user_id);

-- Doctors can update their own profile
create policy "Doctors can update their own profile" on doctor_profiles
  for update using (auth.uid() = user_id);

-- Public can view verified doctors (for patient directory)
create policy "Public can view verified doctors" on doctor_profiles
  for select using (verified_by_hospital = true and is_active = true);

-- Function to automatically update updated_at timestamp
create or replace function update_doctor_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_doctor_profiles_updated_at
  before update on doctor_profiles
  for each row
  execute function update_doctor_profiles_updated_at();
