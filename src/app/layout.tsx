
'use client';

import * as React from 'react';
import { Suspense, useState, useEffect } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { NavigationConfirmationDialog } from '@/components/layout/navigation-confirmation-dialog';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLinkModal } from '@/components/layout/external-link-modal';
import { PosProvider, usePos } from '@/contexts/pos-context';
import { NavigationGuard } from '@/components/layout/navigation-guard';
import { CompanyInfoGuard } from '@/components/layout/company-info-guard';
import { CalculatorModal } from '@/components/shared/calculator-modal';

function AppLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 animate-pulse text-primary"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        <p className="text-muted-foreground">Chargement de l'application...</p>
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = usePos();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return <AppLoading />;
  }
  
  return (
    <div className="antialiased flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 overflow-auto">{children}</main>
      <Toaster />
      <NavigationConfirmationDialog />
      <ExternalLinkModal />
      <CalculatorModal />
    </div>
  );
}


function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <PosProvider>
        {children}
      </PosProvider>
    </FirebaseClientProvider>
  );
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
      <body className="font-body">
        <Providers>
          <Suspense fallback={<AppLoading/>}>
            <CompanyInfoGuard>
              <NavigationGuard />
              <AppContent>
                {children}
              </AppContent>
            </CompanyInfoGuard>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
