-- Migration to allow doctors to see patient names for pending consultations
-- Also allows clinical records to be created even before a formal relationship is fully accepted

-- 1. Profile Visibility: Allow doctors to see names/age of people who have sent them chat requests
DROP POLICY IF EXISTS "Doctors can view profiles of requesting patients" ON profiles;
CREATE POLICY "Doctors can view profiles of requesting patients" ON profiles
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_doctor_chats
      WHERE patient_doctor_chats.patient_id = profiles.id
        AND patient_doctor_chats.doctor_id = auth.uid()
    )
  );

-- 2. Consultation Record Visibility: Allow creation of initial clinical records during the chat request phase
DROP POLICY IF EXISTS "Doctors can create initial consultation records" ON consultation_records;
CREATE POLICY "Doctors can create initial consultation records" ON consultation_records
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = doctor_id
    AND (
      -- Either there's a relationship
      EXISTS (
        SELECT 1 FROM doctor_patient_relationships 
        WHERE doctor_id = auth.uid() 
        AND patient_id = consultation_records.patient_id
        AND is_active = true
      )
      OR
      -- Or there's an active chat request
      EXISTS (
        SELECT 1 FROM patient_doctor_chats
        WHERE doctor_id = auth.uid()
        AND patient_id = consultation_records.patient_id
        AND status = 'active'
      )
    )
  );
