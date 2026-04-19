-- Migration: Guardian-Aware Row Level Security
-- Allows guardians to access health data for profiles where they are the linked user

-- 1. Helper function for guardian check (performance optimization)
CREATE OR REPLACE FUNCTION is_guardian_of(owner_user_id uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM dependents 
    WHERE dependents.user_id = owner_user_id 
    AND dependents.linked_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply Guardian Select Policies

-- Health Entries
CREATE POLICY "Guardians can view linked entries" 
ON health_entries FOR SELECT 
USING (is_guardian_of(user_id));

-- Medications
CREATE POLICY "Guardians can view linked medications" 
ON medications FOR SELECT 
USING (is_guardian_of(user_id));

-- Prescriptions
CREATE POLICY "Guardians can view linked prescriptions" 
ON prescriptions FOR SELECT 
USING (is_guardian_of(patient_id));

-- Bills
CREATE POLICY "Guardians can view linked bills" 
ON bills FOR SELECT 
USING (is_guardian_of(user_id));

-- Medical Reports
CREATE POLICY "Guardians can view linked reports" 
ON medical_reports FOR SELECT 
USING (is_guardian_of(user_id));

-- Consultation Records
CREATE POLICY "Guardians can view linked consultations" 
ON consultation_records FOR SELECT 
USING (is_guardian_of(patient_id));

-- Doctor Summaries
CREATE POLICY "Guardians can view linked summaries" 
ON doctor_summaries FOR SELECT 
USING (is_guardian_of(user_id));

COMMENT ON FUNCTION is_guardian_of IS 'Relational check to verify if the authed user is a linked guardian for the given patient';
