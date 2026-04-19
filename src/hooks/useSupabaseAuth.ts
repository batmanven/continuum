import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string, gender?: string, dateOfBirth?: string, phone?: string, bloodGroup?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          gender: gender || '',
          date_of_birth: dateOfBirth || '',
          phone: phone || '',
          blood_type: bloodGroup || 'Not specified',
        },
      },
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updateProfile = async (updates: any) => {
    if (!user) return { data: null, error: new Error("User not found") };

    try {
      setLoading(true);

      // 1. Sync to Auth Metadata (for session/header)
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (authError) throw authError;

      // 2. Sync to SQL Profiles Table (for relational integrity/search)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: updates.name || updates.full_name,
          gender: updates.gender,
          date_of_birth: updates.dateOfBirth || updates.date_of_birth,
          blood_type: updates.blood_type || updates.bloodGroup,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setUser(authData.user);
      return { data: authData, error: null };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return { data, error };
  };

  const resendOtp = async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    verifyOtp,
    resendOtp,
  };
}