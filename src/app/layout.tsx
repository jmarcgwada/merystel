
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { NavigationConfirmationDialog } from '@/components/layout/navigation-confirmation-dialog';
import { KeyboardProvider } from '@/contexts/keyboard-context';
import { VirtualKeyboard } from '@/components/virtual-keyboard';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLinkModal } from '@/components/layout/external-link-modal';
import { SessionManager } from '@/components/session-manager';
import { PosProvider, usePos } from '@/contexts/pos-context';
import { NavigationGuard } from '@/components/layout/navigation-guard';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-primary animate-pulse"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
        <p className="text-muted-foreground">Chargement de l'application...</p>
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  )
}

function AutoAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const auth = useAuth();
  const { addUser } = usePos();
  const [isAutoLoginDone, setIsAutoLoginDone] = useState(false);
  const autoLoginAttempted = React.useRef(false);

  const superAdminEmail = 'superadmin@zenith.app';
  const superAdminPassword = 'password';

  React.useEffect(() => {
    if (loading || !auth || autoLoginAttempted.current) {
      return;
    }
    
    autoLoginAttempted.current = true;

    if (!user) {
      const autoLogin = async () => {
        try {
          // Attempt to sign in first
          await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
          setIsAutoLoginDone(true);
        } catch (error: any) {
          // If user does not exist, create it
          if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
              await addUser({
                firstName: 'Super',
                lastName: 'Admin',
                email: superAdminEmail,
                role: 'admin',
              }, superAdminPassword);
              
              // Now sign in
              await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
              setIsAutoLoginDone(true);
            } catch (creationError) {
              console.error("Failed to create and sign in super admin:", creationError);
              setIsAutoLoginDone(true); // Stop trying
            }
          } else {
            console.error("Failed to sign in super admin:", error);
            setIsAutoLoginDone(true); // Stop trying
          }
        }
      };
      
      autoLogin();
    } else {
        setIsAutoLoginDone(true);
    }
  }, [user, loading, auth, addUser]);

  if (loading || !isAutoLoginDone) {
    return <AppLoading />;
  }

  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full">
      <head>
        <title>Zenith POS</title>
        <meta name="description" content="Système de point de vente moderne" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased flex flex-col h-screen overflow-hidden">
        <FirebaseClientProvider>
          <PosProvider>
            <AutoAuth>
              <KeyboardProvider>
                <SessionManager>
                  <React.Suspense fallback={<AppLoading/>}>
                    <Header />
                    <main className="flex-1 overflow-auto">{children}</main>
                    <Toaster />
                    <NavigationGuard />
                    <NavigationConfirmationDialog />
                    <VirtualKeyboard />
                    <ExternalLinkModal />
                  </React.Suspense>
                </SessionManager>
              </KeyboardProvider>
            </AutoAuth>
          </PosProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
