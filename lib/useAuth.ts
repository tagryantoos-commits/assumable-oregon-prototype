'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from './supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: string;
}

function mapUser(user: User): AuthUser {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    firstName: meta.first_name || '',
    lastName: meta.last_name || '',
    phone: meta.phone || '',
    userType: meta.user_type || 'buyer',
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapUser(session.user) : null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? mapUser(session.user) : null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return {
    user,
    isLoggedIn: !!user,
    isLoading,
    signOut,
    supabase,
  };
}
