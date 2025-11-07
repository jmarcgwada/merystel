
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LogOut,
  User,
  LockOpen,
} from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';

export function UserNav() {
  const { handleSignOut, isForcedMode, showNavConfirm } = usePos();
  const { user } = useUser();
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname.startsWith('/pos') && href !== pathname) {
      e.preventDefault();
      showNavConfirm(href);
    }
  };

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-auto px-4 py-2 flex flex-col items-end">
              <p className="text-sm font-medium text-foreground">{user?.firstName || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || '...'}</p>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" onClick={(e) => handleNavClick(e, '/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Mon Profil</span>
            </Link>
          </DropdownMenuItem>
          {isForcedMode && (
            <>
              <DropdownMenuSeparator />
              {/* This item is currently non-functional in the provided code */}
              <DropdownMenuItem>
                <LockOpen className="mr-2 h-4 w-4" />
                <span>Quitter le mode forcé</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSignOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
