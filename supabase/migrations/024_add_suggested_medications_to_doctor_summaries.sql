-- Migration to add suggested_medications column to doctor_summaries
alter table doctor_summaries add column if not exists suggested_medications jsonb default '[]'::jsonb;

-- Comment for clarity
comment on column doctor_summaries.suggested_medications is 'AI-generated medication suggestions based on health entries';
