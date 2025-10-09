'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShoppingBag, Truck } from 'lucide-react';

const navLinks = [
    { href: '/commercial/invoices', label: 'Factures', icon: FileText },
    { href: '/commercial/quotes', label: 'Devis', icon: FileText },
    { href: '/commercial/delivery-notes', label: 'Bons de livraison', icon: Truck },
    { href: '/commercial/supplier-orders', label: 'Cdes Fournisseur', icon: ShoppingBag },
]

export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <nav className="flex items-center gap-2 sm:gap-4">
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                            pathname.startsWith(link.href) ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                       <link.icon className="h-4 w-4" />
                        <span className="hidden sm:inline-block">{link.label}</span>
                    </Link>
                ))}
                </nav>
                <Button asChild variant="outline" size="sm" className="btn-back">
                    <Link href="/dashboard">
                        <ArrowLeft />
                        Retour au tableau de bord
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<div>Chargement...</div>}>
            {children}
          </Suspense>
        </main>
    </div>
  );
}
