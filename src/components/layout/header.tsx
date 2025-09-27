
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { usePos } from '@/contexts/pos-context';
import React, { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const { showNavConfirm, order, companyInfo, handleSignOut: handlePosSignOut } = usePos();
  const { user } = useUser();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isInPosOrRestaurant = isClient && (pathname === '/pos' || pathname === '/restaurant');
  const shouldBeDisabled = isInPosOrRestaurant;


  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (order.length > 0 && href !== pathname) {
      e.preventDefault();
      showNavConfirm(href);
    }
  };

  const handleSignOut = async () => {
    await handlePosSignOut();
    router.push('/login');
  };
  
  const canAccessCompanySettings = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className={cn("flex items-center gap-4 flex-1", shouldBeDisabled && 'opacity-50 pointer-events-none')}>
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
          {user && companyInfo?.name && (
            <>
              <Separator orientation="vertical" className="h-6" />
              {canAccessCompanySettings ? (
                  <Link href="/settings/company" className="text-lg font-semibold text-foreground/90 hover:text-primary transition-colors" onClick={(e) => handleNavClick(e, '/settings/company')}>
                    {companyInfo.name}
                  </Link>
              ) : (
                  <span className="text-lg font-semibold text-foreground/90">{companyInfo.name}</span>
              )}
            </>
          )}
        </div>

        <div className={cn("flex items-center justify-end gap-2", shouldBeDisabled && 'opacity-50 pointer-events-none')}>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={shouldBeDisabled}>
                <Button variant="ghost" className="relative h-10 w-auto px-4 py-2 flex flex-col items-end">
                    <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
