'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie, getCookie, eraseCookie } from './cookies';
import { supabase } from './supabase';

export type UserRole = 'farmer' | 'operator' | 'admin' | null;

interface User {
  name: string;
  role: UserRole;
  phone: string;
  address?: string;
  pincode?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, otp: string, rememberMe?: boolean) => Promise<boolean>;
  signUp: (name: string, phone: string, role: UserRole, address?: string, pincode?: string, rememberMe?: boolean) => Promise<boolean>;
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
    // Check for stored session (localStorage first, then cookie)
    const storedUser = localStorage.getItem('agri_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const cookieUser = getCookie('agri_user_remember');
      if (cookieUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(cookieUser));
          setUser(parsedUser);
          // Sync back to localStorage for current session
          localStorage.setItem('agri_user', JSON.stringify(parsedUser));
        } catch (e) {
          console.error("Failed to parse remember me cookie", e);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, otp: string, rememberMe: boolean = false) => {
    // In a real app, verify OTP here. For now, assuming OTP is valid.

    let role: UserRole = null;
    let name = '';
    let address = '';
    let pincode = '';

    try {
      console.log('Attempting login for phone:', phone);
      // 1. Check Admins
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('phone', phone)
        .single();

      if (admin) {
        role = 'admin';
        name = admin.name;
      }

      // 2. Check Operators (if not admin)
      if (!role) {
        const { data: operator } = await supabase
          .from('operators')
          .select('*')
          .eq('phone', phone)
          .single();

        if (operator) {
          role = 'operator';
          name = operator.name;
        }
      }

      // 3. Check Farmers (if not admin or operator)
      if (!role) {
        const { data: farmer } = await supabase
          .from('farmers')
          .select('*')
          .eq('phone', phone)
          .single();

        if (farmer) {
          role = 'farmer';
          name = farmer.name;
          address = farmer.address || '';
          pincode = farmer.pincode || '';
        }
      }

      if (!role) {
        throw new Error('User not found. Please create an account.');
      }

      const newUser: User = { name, role, phone, address, pincode };
      setUser(newUser);

      // Store simple session in localStorage for now (Supabase Auth is better but sticking to current simple flow)
      localStorage.setItem('agri_user', JSON.stringify(newUser));

      if (rememberMe) {
        setCookie('agri_user_remember', encodeURIComponent(JSON.stringify(newUser)), 30);
      }

      // Redirect based on role
      if (role === 'admin') router.push('/dashboard/admin');
      else if (role === 'operator') router.push('/dashboard/operator');
      else router.push('/dashboard/farmer');

      return true;

    } catch (error: any) {
      console.error('Login error:', error.message || error);
      throw error;
    }
  };

  const signUp = async (name: string, phone: string, role: UserRole, address?: string, pincode?: string, rememberMe: boolean = false) => {
    if (role !== 'farmer') {
      throw new Error('Only farmer registration is currently supported publicly.');
    }

    try {
      // 1. Check if they are already an Admin or Operator
      const { data: admin } = await supabase.from('admins').select('id').eq('phone', phone).single();
      if (admin) throw new Error('Account exists as Admin. Please Log In.');

      const { data: op } = await supabase.from('operators').select('id').eq('phone', phone).single();
      if (op) throw new Error('Account exists as Operator. Please Log In.');

      // 2. Check/Upsert Farmer
      // We use upsert to handle both "New User" and "Existing User (e.g. from Quick Booking)"
      // onConflict on 'phone' column.
      const { data, error } = await supabase
        .from('farmers')
        .upsert({
          name,
          phone,
          address,
          pincode
        }, { onConflict: 'phone' })
        .select()
        .single();

      if (error) throw error;

      const newUser: User = {
        name: data.name,
        role: 'farmer',
        phone: data.phone,
        address: data.address,
        pincode: data.pincode
      };

      setUser(newUser);
      localStorage.setItem('agri_user', JSON.stringify(newUser));

      if (rememberMe) {
        setCookie('agri_user_remember', encodeURIComponent(JSON.stringify(newUser)), 30);
      }

      router.push('/dashboard/farmer');
      return true;

    } catch (error: any) {
      console.error('Signup error:', error.message || error);
      throw error;
    }
  };

  const checkUserExists = async (phone: string) => {
    try {
      // Parallel checks could be faster, but sequential is fine for now
      const { data: admin } = await supabase.from('admins').select('id').eq('phone', phone).single();
      if (admin) return true;

      const { data: op } = await supabase.from('operators').select('id').eq('phone', phone).single();
      if (op) return true;

      const { data: farmer } = await supabase.from('farmers').select('id').eq('phone', phone).single();
      if (farmer) return true;

      return false;
    } catch (error) {
      console.error('Check user error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agri_user');
    eraseCookie('agri_user_remember');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, checkUserExists, isLoading }}>
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
