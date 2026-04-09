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

  const updateProfile = async (profileData: { 
    name?: string; 
    gender?: string; 
    dateOfBirth?: string; 
    phone?: string; 
    bloodGroup?: string;
    ice_contacts?: any[];
    ice_name?: string;
    ice_phone?: string;
    ice_relationship?: string;
  }) => {
    const updatePayload: Record<string, any> = {};
    if (profileData.name !== undefined) updatePayload.name = profileData.name;
    if (profileData.gender !== undefined) updatePayload.gender = profileData.gender;
    if (profileData.dateOfBirth !== undefined) updatePayload.date_of_birth = profileData.dateOfBirth;
    if (profileData.phone !== undefined) updatePayload.phone = profileData.phone;
    if (profileData.bloodGroup !== undefined) updatePayload.blood_type = profileData.bloodGroup;
    
    // ICE Data
    if (profileData.ice_contacts !== undefined) updatePayload.ice_contacts = profileData.ice_contacts;
    if (profileData.ice_name !== undefined) updatePayload.ice_name = profileData.ice_name;
    if (profileData.ice_phone !== undefined) updatePayload.ice_phone = profileData.ice_phone;
    if (profileData.ice_relationship !== undefined) updatePayload.ice_relationship = profileData.ice_relationship;

    const { data, error } = await supabase.auth.updateUser({
      data: updatePayload,
    })
    return { data, error }
  }

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    return { data, error }
  }

  const resendOtp = async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    return { data, error }
  }

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
  }
}
