-- Add body_part field to track anatomical location of symptoms
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'symptom_entries' AND column_name = 'body_part') THEN
        ALTER TABLE symptom_entries ADD COLUMN body_part text;
    END IF;
END $$;

-- Create index for better performance on body_part queries
CREATE INDEX IF NOT EXISTS symptom_entries_body_part_idx ON symptom_entries(body_part);

-- Comment for clarity
COMMENT ON COLUMN symptom_entries.body_part IS 'Anatomical location of the symptom (e.g., head, chest, lower-back, quadriceps)';
