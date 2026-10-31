'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserForm from '@/components/admin/UserForm';
import { Loader2 } from 'lucide-react';

interface UserRecord {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

// Client component: the admin session lives in the browser (Supabase Auth
// persists to localStorage), so the user record must be fetched client-side
// for RLS to recognize the admin.
export default function EditUserPage() {
  const params = useParams();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const idParam = params.id;
    const id = typeof idParam === 'string' ? idParam : idParam?.[0] ?? '';

    if (!id) {
      setError('Invalid user id');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUser = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (cancelled) return;
        if (fetchError || !data) {
          setError('User not found');
        } else {
          setUser(data);
        }
      } catch {
        if (!cancelled) setError('User not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div
        data-testid="admin-user-loading-state"
        className="flex justify-center items-center min-h-[400px]"
      >
        <Loader2 className="animate-spin text-[#0071e3]" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        data-testid="admin-user-not-found"
        className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500"
      >
        {error || 'User not found'}
      </div>
    );
  }

  return <UserForm initialData={user} />;
}
