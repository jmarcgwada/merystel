
'use client';

import { useState, useEffect } from 'react';
import type { User as AppUser } from '@/lib/types';

// This will be the new user type, combining Firebase Auth user and our Firestore user profile.
export type CombinedUser = AppUser;

export function useUser() {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a logged-in user since we removed the database connection
    const demoUser: CombinedUser = {
      id: 'demo-user-id',
      firstName: 'Utilisateur',
      lastName: 'de démo',
      email: 'email@example.com',
      companyId: 'main',
      role: 'admin'
    };
    setUser(demoUser);
    setLoading(false);
  }, []);

  return { user, loading };
}
