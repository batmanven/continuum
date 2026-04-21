-- Create symptom_entries table for tracking symptom patterns
create table symptom_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  symptom_name text not null,
  severity integer check (severity >= 1 and severity <= 10),
  description text,
  triggers text[],
  duration text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  weather_data jsonb,
  stress_level integer check (stress_level >= 1 and stress_level <= 10),
  sleep_hours numeric check (sleep_hours >= 0 and sleep_hours <= 24),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index symptom_entries_user_id_idx on symptom_entries(user_id);
create index symptom_entries_symptom_name_idx on symptom_entries(symptom_name);
create index symptom_entries_created_at_idx on symptom_entries(created_at);
create index symptom_entries_severity_idx on symptom_entries(severity);

-- Enable RLS (Row Level Security)
alter table symptom_entries enable row level security;

-- Create policies for users to only access their own symptom entries
create policy "Users can view their own symptom entries" on symptom_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own symptom entries" on symptom_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own symptom entries" on symptom_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own symptom entries" on symptom_entries
  for delete using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function update_symptom_entries_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_symptom_entries_updated_at
  before update on symptom_entries
  for each row
  execute function update_symptom_entries_updated_at();
