
'use client';

import { useState, useEffect } from 'react';
import type { DocumentData } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';

// Mock AuthUser to satisfy the CombinedUser type shape
type MockAuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
};

export type CombinedUser = MockAuthUser & DocumentData & AppUser;

// This is a mock user that will be used throughout the app.
// It has admin privileges by default.
const mockUser: CombinedUser = {
  uid: 'mock-admin-user-01',
  email: 'admin@zenith.com',
  displayName: 'Admin User',
  photoURL: null,
  emailVerified: true,
  phoneNumber: null,
  id: 'mock-admin-user-01',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  companyId: 'main',
};


export function useUser() {
  const [user] = useState<CombinedUser | null>(mockUser);
  const [loading, setLoading] = useState(false); // Set loading to false as we are not fetching anything.

  return { user, loading };
}
