-- Normalize profiles schema to support tiered intelligence access
do $$ 
begin
  -- Add subscription_tier if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'subscription_tier') then
    alter table profiles add column subscription_tier text check (subscription_tier in ('free', 'trial', 'premium', 'institutional')) default 'free';
  end if;

  -- Add trial_ends_at if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'trial_ends_at') then
    alter table profiles add column trial_ends_at timestamp with time zone;
  end if;
end $$;

-- Update the service-level default to 'trial' for existing users to reactivate feature sets
-- Note: Replace 'trial' with target tier as needed
update profiles set subscription_tier = 'trial' where subscription_tier is null or subscription_tier = 'free';
