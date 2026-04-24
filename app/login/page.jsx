'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect them to the right panel
    try {
      const raw = localStorage.getItem('user_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session) {
          if (session.role === 'superadmin') {
            router.replace('/superadmin/dashboard');
          } else if (session.role === 'admin') {
            router.replace('/admin/dashboard');
          } else if (session.role === 'master') {
            router.replace('/master/dashboard');
          } else if (session.role) {
            router.replace('/dashboard');
          }
        }
      }
    } catch {
      // Corrupt session — ignore and show login form
    }
  }, [router]);

  return <LoginForm />;
}
