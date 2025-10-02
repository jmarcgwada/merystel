
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils"

import { usePos } from '@/contexts/pos-context';
import React, { useEffect, useState } from 'react';
import { Separator } from '../ui/separator';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '../ui/button';
import { LogOut, ExternalLink, Keyboard as KeyboardIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User as UserIcon } from 'lucide-react';
import { useKeyboard } from '@/contexts/keyboard-context';

export default function Header() {
  const pathname = usePathname();
  const { 
    showNavConfirm, 
    order, 
    companyInfo, 
    handleSignOut: handlePosSignOut,
    externalLinkModalEnabled,
  } = usePos();
  const { user } = useUser();
  const router = useRouter();

  const { showKeyboard, targetInput } = useKeyboard();
  const [isClient, setIsClient] = useState(false);
  const [showKeyboardBtn, setShowKeyboardBtn] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (targetInput && (targetInput.name === 'category-search' || targetInput.name === 'item-search')) {
      setShowKeyboardBtn(true);
    } else {
      setShowKeyboardBtn(false);
    }
  }, [targetInput]);


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
  const isPosOrRestaurantPage = pathname.startsWith('/pos') || pathname.startsWith('/restaurant');

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full border-b bg-card shadow-sm no-print",
        isClient && isPosOrRestaurantPage && 'pointer-events-none opacity-50'
    )}>
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

        <div className="flex items-center justify-end gap-2">
           {isClient && showKeyboardBtn && (
              <Button 
                variant="outline"
                size="icon"
                onClick={showKeyboard}
              >
                  <KeyboardIcon className="h-4 w-4" />
              </Button>
          )}
          {isClient && externalLinkModalEnabled && (
              <Button 
                variant="outline"
                size="icon"
                onClick={() => (window as any).dispatchEvent(new CustomEvent('toggleExternalLinkModal'))}
              >
                  <ExternalLink className="h-4 w-4" />
              </Button>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
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
