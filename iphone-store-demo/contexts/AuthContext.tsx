'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);


  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Silently ignore AbortError — caused by React Strict Mode remount
        if (error.message?.includes('AbortError') || error.code === 'PGRST116') {
          return false;
        }
        console.error('Error checking admin status:', error.message, error);
        return false;
      }
      return data?.is_admin || false;
    } catch (error: any) {
      // Silently ignore AbortError — caused by React Strict Mode remount
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const adminStatus = await checkAdminStatus(session.user.id);
          if (!isMounted) return;
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // We intentionally removed the onAuthStateChange listener here.
    // Supabase handles token refreshes silently in the background, so we don't
    // need to spam React state updates or database queries on every window focus (Alt+Tab).
    // Initial session is handled by initializeAuth, and login/logout are handled manually.

    return () => {
      isMounted = false;
    };
  }, []);



  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        const adminStatus = await checkAdminStatus(data.user.id);
        setIsAdmin(adminStatus);
        setUser(data.user);
        setSession(data.session);
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
