'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export type UserRole = 'farmer' | 'operator' | 'admin' | null;

interface User {
  id?: string; // Supabase Auth ID
  name: string;
  role: UserRole;
  phone: string;
  address?: string;
  pincode?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, otp: string, rememberMe?: boolean) => Promise<boolean>;
  signUp: (name: string, phone: string, role: UserRole, address?: string, pincode?: string, village?: string, district?: string, service_pincodes?: string[], service_villages?: string[]) => Promise<boolean>;
  logout: () => void;
  checkUserExists: (phone: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const SAFETY_TIMEOUT_MS = 5000;

    // Safety timer: Ensure we stop loading eventually even if Supabase/Network hangs
    const safetyTimer = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Auth check taking too long, forcing app load.');
        setIsLoading(false);
      }
    }, SAFETY_TIMEOUT_MS);

    const initAuth = async () => {
      try {
        // Fast path: Check local session immediately
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user.id, session.user.phone || '');
          if (mounted) {
            if (profile) {
              setUser(profile);
              clearTimeout(safetyTimer);
              setIsLoading(false);
            } else {
              // Zombie session detected (Session exists but no Profile found)
              // This matches the "clearing cookie" fix. We force clear it here.
              console.warn("Session found but no profile. Forcing partial logout to reset state.");
              await supabase.auth.signOut();
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.error("Initial session check failed", e);
        // Ensure we don't leave user in loading state
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to Auth Changes. This fires immediately with the current session state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);

      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.phone || '');
        if (mounted) {
          if (profile) setUser(profile);
          else {
            // If we have a session but no profile, it might be a new signup OR a zombie session.
            // If it's a SIGNED_IN event (login), but no profile, we verifyCtx will handle creation.
            // But if it is INITIAL_SESSION, we should probably clear it?
            // For safety, let's just set User to null.
            setUser(null);
          }
        }
      } else {
        if (mounted) setUser(null);
      }

      // Ensure we clear loading state in all cases (if initAuth didn't yet)
      if (isLoading) {
        clearTimeout(safetyTimer);
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authId: string, phone: string): Promise<User | null> => {
    // Search in all tables by phone simultaneously using Promise.all
    // Normalize phone: remove +91 or other prefixes, take last 10 digits
    if (!phone) return null;
    const cleanPhone = phone.slice(-10);
    console.log('Fetching profile for:', cleanPhone);

    try {
      const [adminRes, opRes, farmerRes] = await Promise.all([
        supabase.from('admins').select('*').eq('phone', cleanPhone).maybeSingle(),
        supabase.from('operators').select('*').eq('phone', cleanPhone).maybeSingle(),
        supabase.from('farmers').select('*').eq('phone', cleanPhone).maybeSingle()
      ]);

      if (adminRes.data) return { id: authId, name: adminRes.data.name, role: 'admin', phone: cleanPhone };
      if (opRes.data) return { id: authId, name: opRes.data.name, role: 'operator', phone: opRes.data.phone, address: opRes.data.location };
      if (farmerRes.data) return { id: authId, name: farmerRes.data.name, role: 'farmer', phone: farmerRes.data.phone, address: farmerRes.data.address, pincode: farmerRes.data.pincode };
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    return null;
  };

  const login = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`, // Hardcoding +91 for India context as per previous logs
      });
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Login error:', error.message);
      if (error.message && error.message.includes('unverified') && error.message.includes('Trial account')) {
        throw new Error('Twilio Trial: Number not verified. Verify in Twilio Console or use a Supabase Test Number.');
      }
      throw error;
    }
  };

  const verifyOtp = async (phone: string, token: string, rememberMe: boolean = true) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token,
        type: 'sms'
      });

      if (error) {
        // Handle common OTP errors more gracefully
        if (error.message.includes('Token has expired') || error.message.includes('invalid')) {
          throw new Error('Invalid or Expired OTP. Please use the most recent code sent to your phone.');
        }
        throw error;
      }
      if (data.session?.user) {
        const userId = data.session.user.id;
        const sessionPhone = data.session.user.phone || phone; // Use authenticated phone from session if available

        // REMOVED: Manual cookie manipulation which was causing infinite loops/white screens.
        // We rely on Supabase's default session handling.

        // Check for pending signup data
        const pendingDataStr = localStorage.getItem('temp_signup_data');
        if (pendingDataStr) {
          const pendingData = JSON.parse(pendingDataStr);
          // Basic check to ensure we are creating profile for the correct phone
          // Compare last 10 digits to be safe
          if (pendingData.phone.slice(-10) === sessionPhone.slice(-10)) {
            await createProfile(userId, pendingData);
          }
          localStorage.removeItem('temp_signup_data');
        }

        // Load Profile
        // Load Profile
        const profile = await fetchProfile(userId, sessionPhone);
        if (profile) {
          setUser(profile);
          return true;
        } else {
          console.warn("User authenticated but no profile found in DB.");
          // Improve Feedback: If we just signed up, this means CreateProfile failed or RLS blocked reading it.
          throw new Error("Authentication successful, but profile creation failed. Please try again or contact support.");
        }
      }
      return false;
    } catch (error: any) {
      console.error('OTP Verify Error:', error.message);
      throw error;
    }
  };

  const createProfile = async (authId: string, data: any) => {
    // Helper to Insert Profile Linked to Auth ID
    // Note: We might want to add 'auth_id' column to tables later for strict linking.
    // For now, we rely on phone number uniqueness and just Insert.

    if (data.role === 'farmer') {
      const { error } = await supabase.from('farmers').insert({
        id: authId, // Can we use authId as PK? Ideally yes, if tables leverage UUID PKs matching Auth. 
        // Existing schema might use UUIDs generated by DB. 
        // Let's assume we maintain the existing ID behavior or update it.
        // Looking at previous migrations, tables use uuid default gen_random_uuid().
        // Ideally we'd store authId in a strictly coupled system, but for this migration:
        // We just insert the data.
        name: data.name,
        phone: data.phone,
        address: data.address,
        pincode: data.pincode,
        village: data.village,
        district: data.district
      });
      if (error) throw error;
    } else if (data.role === 'operator') {
      const { error } = await supabase.from('operators').insert({
        // id: authId, // See above
        name: data.name,
        phone: data.phone,
        location: data.address, // Base location
        service_pincodes: data.service_pincodes,
        service_villages: data.service_villages,
        district: data.district,
        jobs_completed: 0,
        status: 'Idle'
      });
      if (error) throw error;
    }
  };

  const signUp = async (name: string, phone: string, role: UserRole, address?: string, pincode?: string, village?: string, district?: string, service_pincodes?: string[], service_villages?: string[]) => {
    try {
      // 1. Check if user already exists in DB
      const exists = await checkUserExists(phone);
      if (exists) throw new Error('User already exists in database. Please Login.');

      // 2. Init Auth Flow (Same as login, since Supabase creates user on first OTP)
      // Actually, we can just call signInWithOtp. 
      // But we need to save the profile data *somewhere* so we can create these record AFTER verification.
      // For now, we'll store temporary signup data in localStorage and create record after OTP verify.

      localStorage.setItem('temp_signup_data', JSON.stringify({
        name, phone, role, address, pincode, village, district, service_pincodes, service_villages
      }));

      await login(phone);
      return true;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Need to handle profile creation AFTER verification if it doesn't exist.
  // This logic works best if the UI handles the "Verify" step and then calls "CompleteSignup"
  // But to minimize UI changes, we'll hook into verifyOtp in the UI component or here.
  // For this refactor, I am keeping the interface compatible-ish.

  // NOTE: The UI calling `login` expects `(phone, otp)` immediately (simulated). 
  // Real auth separates these. The UI layers using `useAuth` need to be updated to support the 2-step flow.

  // Since I cannot rewrite all UI files in one go, I will keep the `login` signature essentially broken for the 2nd arg?
  // No, I must update the UI.

  const checkUserExists = async (phone: string) => {
    try {
      if (!phone) return false;
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      console.log('Checking existence for:', cleanPhone);

      // Timeout wrapper to prevent hanging
      const dbCheck = Promise.all([
        supabase.from('admins').select('id').eq('phone', cleanPhone).maybeSingle(),
        supabase.from('operators').select('id').eq('phone', cleanPhone).maybeSingle(),
        supabase.from('farmers').select('id').eq('phone', cleanPhone).maybeSingle()
      ]);

      const timeout = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 8000)
      );

      const [adminRes, opRes, farmerRes] = await Promise.race([dbCheck, timeout]) as any[];

      if (adminRes?.error) console.error('Admin check error:', adminRes.error);
      if (opRes?.error) console.error('Operator check error:', opRes.error);
      if (farmerRes?.error) console.error('Farmer check error:', farmerRes.error);

      if (adminRes?.data || opRes?.data || farmerRes?.data) return true;
      return false;
    } catch (error) {
      console.error('checkUserExists failed:', error);
      // If it's a timeout or network error, we might default to FALSE to allow them to TRY signing up,
      // or return FALSE so they get "User not found" (which is better than hanging).
      return false;
    }
  };
};

const logout = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
  setUser(null);
  localStorage.removeItem('agri_user');
  router.push('/?logout=success');
};

return (
  <AuthContext.Provider value={{ user, login, verifyOtp, signUp, logout, checkUserExists, isLoading }}>
    {children}
  </AuthContext.Provider>
);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
