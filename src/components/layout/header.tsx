
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils"

import { usePos } from '@/contexts/pos-context';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { LogOut, ExternalLink, Keyboard as KeyboardIcon, ArrowLeft, LockOpen, Delete, Blocks, FileText, ShoppingCart, Calculator } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { User as UserIcon } from 'lucide-react';
import { useKeyboard } from '@/components/keyboard-context';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { StorageIndicator } from './storage-indicator';

const PinKey = ({ value, onClick }: { value: string, onClick: (value: string) => void }) => (
    <Button
        type="button"
        variant="outline"
        className="h-14 w-14 text-2xl font-bold"
        onClick={() => onClick(value)}
    >
        {value}
    </Button>
);

export default function Header() {
  const pathname = usePathname();
  const { 
    showNavConfirm, 
    order, 
    handleSignOut,
    isForcedMode,
    setIsForcedMode: setGlobalForcedMode,
    toast,
    defaultSalesMode,
    externalLinkModalEnabled,
    isLoading: isPosLoading,
    user,
    setCurrentSaleContext,
    companyInfo,
    setIsCalculatorOpen,
    commercialViewLevel
  } = usePos();

  const router = useRouter();
  const { toggleKeyboard, isKeyboardVisibleInHeader } = useKeyboard();
  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const showHeader = useMemo(() => {
    if (!isClient) return false; // Don't render header on server
    const isCommercialPage = pathname.startsWith('/commercial');
    return !isCommercialPage || commercialViewLevel < 2;
  }, [isClient, pathname, commercialViewLevel]);


  const salesModeLink = useMemo(() => {
    if (!isClient) return '#'; // Return a placeholder for SSR
    switch (defaultSalesMode) {
        case 'supermarket': return '/supermarket';
        case 'restaurant': return '/restaurant';
        case 'pos': default: return '/pos';
    }
  }, [isClient, defaultSalesMode]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const isSalesPage = ['/pos', '/supermarket', '/restaurant', '/commercial'].some(page => pathname.startsWith(page));
    if (isSalesPage && order.length > 0) {
      e.preventDefault();
      showNavConfirm(href);
    }
  };
  
  const handleCommercialClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setCurrentSaleContext({ documentType: 'invoice' });
    handleNavClick(e, '/commercial/invoices');
  }

  const generateDynamicPin = () => {
    const now = new Date();
    const month = (now.getMonth() + 1);
    const day = now.getDate();
    
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const difference = Math.abs(day - month).toString();

    return `${monthStr}${dayStr}${difference}`;
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const correctPin = generateDynamicPin();
    if (pin === correctPin) {
        setGlobalForcedMode(false);
        toast({ title: 'Mode forcé désactivé', description: 'Vous pouvez à nouveau naviguer librement.' });
        setPinDialogOpen(false);
        setPin('');
        router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Code PIN incorrect',
      });
      setPin('');
    }
  };

  const handlePinKeyPress = (key: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + key);
    }
  };
  
  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const isUserInForcedMode = isForcedMode;

  if (!showHeader) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm no-print">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md p-2 -m-2 transition-colors"
              onClick={(e) => {
                if (user) handleNavClick(e, '/');
              }}
            >
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
             {isClient && companyInfo?.name && (
                <>
                    <Separator orientation="vertical" className="h-6" />
                    <Link href="/settings/company?from=/dashboard" onClick={(e) => handleNavClick(e, '/settings/company?from=/dashboard')}>
                        <span className="font-semibold text-muted-foreground hidden sm:inline-block hover:text-primary transition-colors">
                            {companyInfo.name}
                        </span>
                    </Link>
                </>
            )}
             {isClient && !companyInfo?.name && (
                 <>
                    <Separator orientation="vertical" className="h-6" />
                    <Skeleton className="h-5 w-32" />
                 </>
            )}
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            {!isClient ? (
                <>
                    <Button variant="ghost" disabled><FileText />Commercial</Button>
                    <Button variant="ghost" disabled><ShoppingCart />Caisse</Button>
                    <Button variant="ghost" disabled><Blocks />Gestion</Button>
                </>
            ) : (
                <>
                    <Button asChild variant={pathname.startsWith('/commercial') ? 'default' : 'ghost'}>
                        <Link href="/commercial/invoices" onClick={handleCommercialClick}>
                            <FileText />Commercial
                        </Link>
                    </Button>
                    <Button asChild variant={pathname.startsWith('/pos') || pathname.startsWith('/restaurant') || pathname.startsWith('/supermarket') ? 'default' : 'ghost'}>
                        <Link href={salesModeLink} onClick={e => handleNavClick(e, salesModeLink)}>
                            <ShoppingCart />Caisse
                        </Link>
                    </Button>
                    <Button asChild variant={pathname.startsWith('/management') ? 'default' : 'ghost'}>
                        <Link href="/management/items" onClick={e => handleNavClick(e, '/management/items')}>
                            <Blocks />Gestion
                        </Link>
                    </Button>
                </>
            )}
          </nav>

          <div className="flex items-center justify-end gap-2 pl-4 flex-1">
            <StorageIndicator />
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCalculatorOpen(true)}
            >
                <Calculator className="h-4 w-4" />
            </Button>
            {!isPosLoading && isKeyboardVisibleInHeader && (
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={toggleKeyboard}
                >
                    <KeyboardIcon className="h-4 w-4" />
                </Button>
            )}
            {!isPosLoading && externalLinkModalEnabled && (
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => (window as any).dispatchEvent(new CustomEvent('toggleExternalLinkModal'))}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
            )}
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
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Mon Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  {isUserInForcedMode && (
                    <>
                      <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={() => setPinDialogOpen(true)}>
                         <LockOpen className="mr-2 h-4 w-4" />
                         <span>Quitter le mode forcé</span>
                       </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>
      </header>
       <AlertDialog open={isPinDialogOpen} onOpenChange={setPinDialogOpen}>
            <AlertDialogContent className="sm:max-w-sm">
                <form onSubmit={handlePinSubmit}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Quitter le mode forcé</AlertDialogTitle>
                        <AlertDialogDescription>
                            Veuillez entrer le code PIN dynamique pour déverrouiller l'application.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-4">
                       <div className="flex justify-center items-center h-12 bg-muted rounded-md border">
                          <p className="text-3xl font-mono tracking-[0.5em]">
                            {pin.split('').map(() => '•').join('')}
                          </p>
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                            <PinKey value="1" onClick={handlePinKeyPress} />
                            <PinKey value="2" onClick={handlePinKeyPress} />
                            <PinKey value="3" onClick={handlePinKeyPress} />
                            <PinKey value="4" onClick={handlePinKeyPress} />
                            <PinKey value="5" onClick={handlePinKeyPress} />
                            <PinKey value="6" onClick={handlePinKeyPress} />
                            <PinKey value="7" onClick={handlePinKeyPress} />
                            <PinKey value="8" onClick={handlePinKeyPress} />
                            <PinKey value="9" onClick={handlePinKeyPress} />
                             <Button type="button" variant="outline" className="h-14 w-14" onClick={handlePinBackspace}>
                                <Delete className="h-6 w-6"/>
                             </Button>
                            <PinKey value="0" onClick={handlePinKeyPress} />
                       </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button" onClick={() => { setPin(''); setPinDialogOpen(false); }}>Annuler</AlertDialogCancel>
                        <AlertDialogAction type="submit">
                            Déverrouiller
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
