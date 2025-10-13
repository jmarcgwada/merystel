
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils"

import { usePos } from '@/contexts/pos-context';
import React, { useEffect, useState, useMemo } from 'react';
import { Separator } from '../ui/separator';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '../ui/button';
import { LogOut, ExternalLink, Keyboard as KeyboardIcon, ArrowLeft, LockOpen, Delete, Blocks, FileText, ShoppingCart } from 'lucide-react';
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
import { useKeyboard } from '@/contexts/keyboard-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '../ui/skeleton';

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
    companyInfo, 
    showNavConfirm, 
    order, 
    handleSignOut: handlePosSignOut,
    isForcedMode,
    setIsForcedMode: setGlobalForcedMode,
    toast,
    defaultSalesMode,
    externalLinkModalEnabled
  } = usePos();
  const { user } = useUser();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [isPinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { toggleKeyboard, isKeyboardVisibleInHeader } = useKeyboard();
  
  const salesModeLink = useMemo(() => {
    switch (defaultSalesMode) {
      case 'supermarket':
        return '/supermarket';
      case 'restaurant':
        return '/restaurant';
      case 'pos':
      default:
        return '/pos';
    }
  }, [defaultSalesMode]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const isSalesPage = ['/pos', '/supermarket', '/restaurant', '/commercial'].some(page => pathname.startsWith(page));
    if (isSalesPage && order.length > 0) {
      e.preventDefault();
      showNavConfirm(href);
    }
  };

  const handleSignOut = async () => {
    // await handlePosSignOut(); // Firebase-related
    router.push('/login');
  };
  
  const canAccessCompanySettings = user?.role === 'admin';

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
        if(user?.isForcedMode) {
          toast({ title: 'Non autorisé', description: "Le mode forcé est activé pour votre compte et ne peut être déverrouillé que par un administrateur."})
        } else {
          setGlobalForcedMode(false);
          toast({ title: 'Mode forcé désactivé', description: 'Vous pouvez à nouveau naviguer librement.' });
        }
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
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
              <Button asChild variant={pathname.startsWith('/commercial') ? 'default' : 'ghost'}>
                  <Link href="/commercial" onClick={e => handleNavClick(e, '/commercial')}><FileText />Commercial</Link>
              </Button>
              <Button asChild variant={pathname.startsWith('/pos') || pathname.startsWith('/restaurant') || pathname.startsWith('/supermarket') ? 'default' : 'ghost'}>
                {isClient ? (
                  <Link href={salesModeLink} onClick={e => handleNavClick(e, salesModeLink)}><ShoppingCart />Caisse</Link>
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2"><ShoppingCart />Caisse</div>
                )}
              </Button>
              <Button asChild variant={pathname.startsWith('/management') ? 'default' : 'ghost'}>
                  <Link href="/management/items" onClick={e => handleNavClick(e, '/management/items')}><Blocks />Gestion</Link>
              </Button>
          </nav>

          <div className="flex items-center justify-end gap-2 pl-4 flex-1">
            {isClient && isKeyboardVisibleInHeader && (
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={toggleKeyboard}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-auto px-4 py-2 flex flex-col items-end">
                      <p className="text-sm font-medium text-foreground">Utilisateur</p>
                      <p className="text-xs text-muted-foreground">email@example.com</p>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Utilisateur de démo</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        email@example.com
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
