-- Create doctor_summaries table for storing generated health summaries
create table doctor_summaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  summary text not null,
  insights text[],
  recommendations text[],
  health_entry_ids uuid[] default '{}',
  date_range_start timestamp with time zone,
  date_range_end timestamp with time zone,
  generated_at timestamp with time zone default now(),
  is_favorite boolean default false,
  tags text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index doctor_summaries_user_id_idx on doctor_summaries(user_id);
create index doctor_summaries_generated_at_idx on doctor_summaries(generated_at);
create index doctor_summaries_is_favorite_idx on doctor_summaries(is_favorite);
create index doctor_summaries_tags_idx on doctor_summaries using gin(tags);

-- Enable RLS (Row Level Security)
alter table doctor_summaries enable row level security;

-- Create policies for users to only access their own summaries
create policy "Users can view their own doctor summaries" on doctor_summaries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own doctor summaries" on doctor_summaries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own doctor summaries" on doctor_summaries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own doctor summaries" on doctor_summaries
  for delete using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function update_doctor_summaries_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_doctor_summaries_updated_at
  before update on doctor_summaries
  for each row
  execute function update_doctor_summaries_updated_at();
