
'use client';

import * as React from 'react';
import { Suspense, useState, useEffect } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { NavigationConfirmationDialog } from '@/components/layout/navigation-confirmation-dialog';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PosProvider, usePos } from '@/contexts/pos-context';
import { NavigationGuard } from '@/components/layout/navigation-guard';
import { CompanyInfoGuard } from '@/components/layout/company-info-guard';
import { CalculatorModal } from '@/components/shared/calculator-modal';
import { AppLoading } from '@/components/layout/app-loading';
import { ExternalLinkModal } from '@/components/layout/external-link-modal';

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
          <Suspense fallback={<AppLoading />}>
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
