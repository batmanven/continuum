-- CONTINUUM DATA CLEANUP SCRIPT (v2 - Fixed)
-- Purpose: Remove all application data associated with specific user accounts.
-- Fixes: Corrected column names and deletion order for foreign key constraints.

DO $$ 
DECLARE 
    target_ids UUID[] := ARRAY[
        '4d0d6188-427a-4929-9a37-c3903645cee8'::UUID, 
        '85f9b7b9-1cef-4dc1-8b67-037abce0a534'::UUID
    ];
    uid UUID;
BEGIN
    FOREACH uid IN ARRAY target_ids
    LOOP
        RAISE NOTICE 'Starting cleanup for User ID: %', uid;

        -- 1. High-Dependency Tables (Reference others)
        DELETE FROM chat_messages WHERE sender_id = uid;
        DELETE FROM medical_reports WHERE patient_id = uid OR doctor_id = uid;
        DELETE FROM prescriptions WHERE patient_id = uid OR doctor_id = uid;
        
        -- Delete consultation_records BEFORE patient_doctor_chats 
        -- due to linked_chat_id reference in some migrations
        DELETE FROM consultation_records WHERE patient_id = uid OR doctor_id = uid;

        -- 2. Communication & Relationships
        DELETE FROM patient_doctor_chats WHERE patient_id = uid OR doctor_id = uid;
        DELETE FROM doctor_patient_relationships WHERE doctor_id = uid OR patient_id = uid;
        DELETE FROM connection_verifications WHERE sender_user_id = uid OR target_user_id = uid;

        -- 3. Health Tracking Data
        DELETE FROM health_passports WHERE user_id = uid;
        DELETE FROM medications WHERE user_id = uid;
        DELETE FROM health_entries WHERE user_id = uid;
        DELETE FROM symptom_entries WHERE user_id = uid;
        DELETE FROM doctor_summaries WHERE user_id = uid OR doctor_id = uid;

        -- 4. Billing
        DELETE FROM bills WHERE user_id = uid;

        -- 5. Family & Dependents
        -- Ensure we clear dependents where they are linked as a user or owned
        DELETE FROM dependents WHERE user_id = uid OR linked_user_id = uid;

        -- 6. Application Profiles
        -- Corrected: using user_id for doctor_profiles
        DELETE FROM doctor_profiles WHERE user_id = uid;
        -- Profiles in public schema (referenced in migration 021)
        DELETE FROM profiles WHERE id = uid;

        -- 7. Supabase Auth (Requires Superuser/Dashboard privileges)
        -- Removing all blockers above should allow the Auth delete to proceed.
        BEGIN
            DELETE FROM auth.users WHERE id = uid;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not delete from auth.users: %. You may need to click "Delete User" manually in the Supabase Auth Dashboard after running this script.', SQLERRM;
        END;

        RAISE NOTICE 'Completed cleanup for User ID: %', uid;
    END LOOP;
END $$;
