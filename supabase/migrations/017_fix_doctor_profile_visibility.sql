-- Migration to simplify doctor visibility policies
-- Any authenticated user should be able to see doctors as long as they are active and accepting patients

-- 1. Drop the old restrictive policy
DROP POLICY IF EXISTS "Public can view verified doctors" ON doctor_profiles;

-- 2. Create the new simplified policy
CREATE POLICY "Authenticated users can see active and accepting doctors" ON doctor_profiles
  FOR SELECT 
  TO authenticated
  USING (
    is_active = true 
    AND (accepting_patients = true OR accepting_patients IS NULL)
  );

-- 3. Also allow patients to see ANY doctor they have a relationship with
CREATE POLICY "Patients can view their linked specialists" ON doctor_profiles
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_patient_relationships
      WHERE doctor_patient_relationships.doctor_id = doctor_profiles.user_id
        AND doctor_patient_relationships.patient_id = auth.uid()
        AND is_active = true
    )
  );
