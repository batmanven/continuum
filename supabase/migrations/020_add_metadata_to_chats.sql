-- Add metadata column to patient_doctor_chats to store flexible data like closure reasons
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute 
                   WHERE attrelid = 'patient_doctor_chats'::regclass 
                   AND attname = 'metadata') THEN
        ALTER TABLE patient_doctor_chats ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
