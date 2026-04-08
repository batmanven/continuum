-- Update dependents table to include missing fields
alter table dependents add column if not exists blood_type text;
alter table dependents add column if not exists phone text;
alter table dependents add column if not exists email text;

-- Add a comment for clarity
comment on column dependents.blood_type is 'Critical life-saving health information';
comment on column dependents.phone is 'Optional contact information for family member';
comment on column dependents.email is 'Optional contact information for family member';
