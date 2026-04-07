-- Create dependents table
create table dependents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  relationship text not null,
  gender text,
  date_of_birth date,
  created_at timestamp with time zone default now()
);

create index dependents_user_id_idx on dependents(user_id);
alter table dependents enable row level security;
create policy "Users can view their own dependents" on dependents for select using (auth.uid() = user_id);
create policy "Users can insert their own dependents" on dependents for insert with check (auth.uid() = user_id);
create policy "Users can update their own dependents" on dependents for update using (auth.uid() = user_id);
create policy "Users can delete their own dependents" on dependents for delete using (auth.uid() = user_id);

-- Create medications table
create table medications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  dependent_id uuid references dependents(id),
  name text not null,
  dosage text,
  frequency text,
  active boolean default true,
  started_on date default CURRENT_DATE,
  notes text,
  drug_interactions_cache jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index medications_user_id_idx on medications(user_id);
alter table medications enable row level security;
create policy "Users can view their own medications" on medications for select using (auth.uid() = user_id);
create policy "Users can insert their own medications" on medications for insert with check (auth.uid() = user_id);
create policy "Users can update their own medications" on medications for update using (auth.uid() = user_id);
create policy "Users can delete their own medications" on medications for delete using (auth.uid() = user_id);


-- Create health_passports table
create table health_passports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  dependent_id uuid references dependents(id),
  public_token text unique not null,
  is_active boolean default true,
  shared_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index health_passports_user_id_idx on health_passports(user_id);
create index health_passports_token_idx on health_passports(public_token);
alter table health_passports enable row level security;

-- Owner policies
create policy "Users can view their own passports" on health_passports for select using (auth.uid() = user_id);
create policy "Users can manage their own passports" on health_passports for all using (auth.uid() = user_id);

-- Public access policy for active passports
create policy "Anyone can view active passports by token" on health_passports
  for select using (is_active = true);


-- Alter existing core tables to support dependent_id
alter table health_entries add column dependent_id uuid references dependents(id);
alter table symptom_entries add column dependent_id uuid references dependents(id);
alter table doctor_summaries add column dependent_id uuid references dependents(id);
alter table bills add column dependent_id uuid references dependents(id);
