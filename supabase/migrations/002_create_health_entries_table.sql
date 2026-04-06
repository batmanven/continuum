-- Create health_entries table for storing personal health data
create table health_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  entry_type text not null check (entry_type in ('symptom', 'medication', 'appointment', 'lab_result', 'mood', 'energy', 'sleep', 'general')),
  raw_content text not null,
  structured_data jsonb,
  ai_processed boolean default false,
  confidence_score numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index health_entries_user_id_idx on health_entries(user_id);
create index health_entries_type_idx on health_entries(entry_type);
create index health_entries_created_at_idx on health_entries(created_at);
create index health_entries_ai_processed_idx on health_entries(ai_processed);

-- Enable RLS (Row Level Security)
alter table health_entries enable row level security;

-- Create policies for users to only access their own health entries
create policy "Users can view their own health entries" on health_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own health entries" on health_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own health entries" on health_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own health entries" on health_entries
  for delete using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function update_health_entries_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_health_entries_updated_at
  before update on health_entries
  for each row
  execute function update_health_entries_updated_at();
