-- Add linked_chat_id to consultation_records to track source of record
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute 
                   WHERE attrelid = 'consultation_records'::regclass 
                   AND attname = 'linked_chat_id') THEN
        ALTER TABLE consultation_records ADD COLUMN linked_chat_id UUID REFERENCES patient_doctor_chats(id);
    END IF;
END $$;

-- Update RLS if needed (already broad enough from previous migrations)
