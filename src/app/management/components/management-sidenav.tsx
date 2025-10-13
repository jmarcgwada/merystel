

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, LayoutGrid, Users, CreditCard, Percent, Utensils, UserCog, BarChart3, Truck } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default function ManagementSideNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const navLinks = [
    { href: '/management/items', label: 'Articles', icon: Box },
    { href: '/management/categories', label: 'Catégories', icon: LayoutGrid },
    { href: '/management/tables', label: 'Tables', icon: Utensils },
    { href: '/management/customers', label: 'Clients', icon: Users },
    { href: '/management/suppliers', label: 'Fournisseurs', icon: Truck },
    { href: '/management/payment-methods', label: 'Paiements', icon: CreditCard },
    { href: '/management/vat', label: 'TVA', icon: Percent },
  ];
  
  const reportLinks = [
    { href: '/reports', label: 'Pièces de vente', icon: BarChart3 },
    { href: '/reports/payments', label: 'Paiements', icon: CreditCard },
  ]

  if (!isClient) {
      // Render a placeholder or skeleton while waiting for client-side mount
      return (
          <div className="p-4 space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
              ))}
          </div>
      );
  }

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-secondary',
              pathname.startsWith(link.href) && 'bg-secondary text-primary'
          )}
          >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
      <div className="my-2 border-t -mx-4"></div>
      <h3 className="px-3 text-xs font-semibold text-muted-foreground/80 tracking-wider">RAPPORTS</h3>
       {reportLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-secondary',
              pathname.startsWith(link.href) && 'bg-secondary text-primary'
          )}
          >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

    