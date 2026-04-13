-- Add body_part field to track anatomical location of symptoms
alter table symptom_entries add column body_part text;

-- Create index for better performance on body_part queries
create index symptom_entries_body_part_idx on symptom_entries(body_part);

-- Comment for clarity
comment on column symptom_entries.body_part is 'Anatomical location of the symptom (e.g., head, chest, lower-back, quadriceps)';
