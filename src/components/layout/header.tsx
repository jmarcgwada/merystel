'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  Grid,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Settings,
  User,
  LogOut,
  PanelLeft,
  BarChart3,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/contexts/pos-context';
import React from 'react';

const navLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: Grid },
  { href: '/pos', label: 'Point de Vente', icon: ShoppingCart },
  { href: '/restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { href: '/commercial', label: 'Commercial', icon: FileText },
  { href: '/management/items', label: 'Gestion', icon: Package },
  { href: '/reports', label: 'Rapports', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { showNavConfirm, order } = usePos();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href.startsWith('/management')) return pathname.startsWith('/management');
    return pathname.startsWith(href);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname.startsWith('/pos') && order.length > 0 && !href.startsWith('/pos')) {
      e.preventDefault();
      showNavConfirm(href);
    }
  };

  const NavLink = ({ href, label, icon: Icon, isSheet = false }: { href: string; label: string; icon: React.ElementType; isSheet?: boolean }) => (
    <Link
      href={href}
      onClick={(e) => handleNavClick(e, href)}
      className={cn(
        isSheet
          ? 'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-secondary'
          : 'text-sm font-medium transition-colors hover:text-primary',
        isActive(href)
          ? isSheet ? 'bg-secondary text-primary' : 'text-primary'
          : !isSheet ? 'text-muted-foreground' : ''
      )}
    >
      {isSheet && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
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
          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <div className="flex h-full flex-col">
                    <div className="flex items-center p-4 border-b">
                        <Link href="/dashboard" className="flex items-center gap-2" onClick={(e) => handleNavClick(e, '/dashboard')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                            <span className="text-lg font-bold text-foreground font-headline">Zenith POS</span>
                        </Link>
                    </div>
                  <nav className="flex flex-col gap-2 p-4">
                    {navLinks.map((link) => (
                      <NavLink key={link.href} {...link} isSheet={true} />
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src="https://picsum.photos/seed/user/100/100"
                    alt="Jean Marc"
                  />
                  <AvatarFallback>JM</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Jean Marc</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@zenithpos.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
