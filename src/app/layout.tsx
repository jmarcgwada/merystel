
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { PosProvider } from '@/contexts/pos-context';
import { NavigationConfirmationDialog } from '@/components/layout/navigation-confirmation-dialog';
import { KeyboardProvider } from '@/contexts/keyboard-context';
import { VirtualKeyboard } from '@/components/virtual-keyboard';

export const metadata: Metadata = {
  title: 'Zenith POS',
  description: 'Système de point de vente moderne',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased h-full flex flex-col">
        <PosProvider>
          <KeyboardProvider>
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <Toaster />
            <NavigationConfirmationDialog />
            <VirtualKeyboard />
          </KeyboardProvider>
        </PosProvider>
      </body>
    </html>
  );
}
