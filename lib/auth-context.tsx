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
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Authenticated, now fetch profile
        const profile = await fetchProfile(session.user.id, session.user.phone!);
        if (profile) {
          setUser(profile);
        } else {
          // Logged in but no profile found (this shouldn't happen unless data mismatch)
          // Could redirect to onboarding
        }
      } else {
        // Fallback to local storage for "remember me" behavior if auth session is gone?
        // Ideally we stick to Supabase session.
        // For migration: Check if we have the old local storage and clear it to forceful migration
        localStorage.removeItem('agri_user');
      }
      setIsLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.phone!);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authId: string, phone: string): Promise<User | null> => {
    // Search in all tables by phone (since we might not have linked authId yet)
    // Ideally we search by auth_id, but during migration we match by phone

    // 1. Admin
    const { data: admin } = await supabase.from('admins').select('*').eq('phone', phone).single();
    if (admin) return { id: authId, name: admin.name, role: 'admin', phone };

    // 2. Operator
    const { data: op } = await supabase.from('operators').select('*').eq('phone', phone).single();
    if (op) return { id: authId, name: op.name, role: 'operator', phone: op.phone, address: op.location };

    // 3. Farmer
    const { data: farmer } = await supabase.from('farmers').select('*').eq('phone', phone).single();
    if (farmer) return { id: authId, name: farmer.name, role: 'farmer', phone: farmer.phone, address: farmer.address, pincode: farmer.pincode };

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

      if (error) throw error;
      if (data.session?.user) {
        const userId = data.session.user.id;

        // Handle "Remember Me" (Session vs Persistent Cookie)
        if (!rememberMe) {
          // Supabase defaults to persistent cookies. We manually convert them to session cookies
          // by re-setting them without Max-Age/Expires.
          // Note: This matches the default project prefix 'sb-' or typical supabase pattern.
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
              const trimmed = cookie.trim();
              if (trimmed.startsWith('sb-') && trimmed.includes('-auth-token')) {
                const [name, value] = trimmed.split('=');
                // Re-set as session cookie (path=/ is critical)
                document.cookie = `${name}=${value}; path=/; samesite=lax`;
              }
            });
          }
        }

        // Check for pending signup data
        const pendingDataStr = localStorage.getItem('temp_signup_data');
        if (pendingDataStr) {
          const pendingData = JSON.parse(pendingDataStr);
          // Basic check to ensure we are creating profile for the correct phone
          if (pendingData.phone === phone) {
            await createProfile(userId, pendingData);
          }
          localStorage.removeItem('temp_signup_data');
        }

        // Load Profile
        const profile = await fetchProfile(userId, phone);
        setUser(profile);
        return true;
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
      const { data: admin } = await supabase.from('admins').select('id').eq('phone', phone).single();
      if (admin) return true;
      const { data: op } = await supabase.from('operators').select('id').eq('phone', phone).single();
      if (op) return true;
      const { data: farmer } = await supabase.from('farmers').select('id').eq('phone', phone).single();
      if (farmer) return true;
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('agri_user');
    router.push('/');
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
