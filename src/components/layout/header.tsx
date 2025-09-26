
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { usePos } from '@/contexts/pos-context';
import React from 'react';
import { Separator } from '../ui/separator';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { showNavConfirm, order, companyInfo, authRequired } = usePos();
  const { user } = useUser();
  const auth = useAuth();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (order.length > 0 && href !== pathname) {
      e.preventDefault();
      showNavConfirm(href);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={(e) => handleNavClick(e, '/dashboard')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span className="text-xl font-bold text-foreground font-headline">
              Zenith POS
            </span>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-normal text-muted-foreground">{companyInfo?.name}</span>
        </div>

        <div className="flex items-center justify-end gap-4">
          {authRequired && user && (
            <>
              <span className="text-sm text-muted-foreground">
                Connecté en tant que {user.firstName}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Déconnexion">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
