
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, LayoutGrid, Users, CreditCard, Percent, Utensils, Truck, History, Landmark, Library, BarChart3 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePos } from '@/contexts/pos-context';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';

export default function ManagementSideNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { 
      items, 
      categories, 
      tables, 
      customers, 
      suppliers, 
      paymentMethods, 
      vatRates,
      sales,
      cheques,
      remises,
  } = usePos();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const mainNavLinks = [
    { href: '/management/items', label: 'Articles', icon: Box, count: items?.length || 0 },
    { href: '/management/categories', label: 'Catégories', icon: LayoutGrid, count: categories?.length || 0 },
    { href: '/management/tables', label: 'Tables', icon: Utensils, count: tables?.filter(t => t.id !== 'takeaway').length || 0 },
    { href: '/management/customers', label: 'Clients', icon: Users, count: customers?.length || 0 },
    { href: '/management/suppliers', label: 'Fournisseurs', icon: Truck, count: suppliers?.length || 0 },
  ];

  const accountingNavLinks = [
    { href: '/management/payment-methods', label: 'Moyens de paiement', icon: CreditCard, count: paymentMethods?.length || 0 },
    { href: '/management/remises', label: 'Remises', icon: Library, count: remises?.length || 0 },
  ];
  
  const vatLink = { href: '/management/vat', label: 'TVA', icon: Percent, count: vatRates?.length || 0 };


  const reportLinks = [
    { href: '/reports', label: 'Pièces de vente', icon: BarChart3 },
    { href: '/reports/payments', label: 'Paiements', icon: CreditCard },
  ];
  
  const financeNavLinks = [
      { href: '/management/checks', label: 'Chèques', icon: Landmark, count: cheques?.filter(c => c.statut === 'enPortefeuille').length || 0 },
      { href: '/management/recurring', label: 'Récurrences', icon: History, count: sales?.filter(s => s.isRecurring).length || 0 },
  ];

  if (!isClient) {
      return (
          <div className="p-4 space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
              ))}
          </div>
      );
  }

  const renderLink = (link: { href: string; label: string; icon: React.ElementType; count?: number }) => (
    <Link
      key={link.href}
      href={link.href}
      className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-secondary',
          pathname.startsWith(link.href) && 'bg-secondary text-primary'
      )}
      >
      <link.icon className="h-4 w-4" />
      <span className="flex-1">{link.label}</span>
      {typeof link.count !== 'undefined' && <Badge variant={pathname.startsWith(link.href) ? "default" : "secondary"}>{link.count}</Badge>}
    </Link>
  );

  return (
    <nav className="flex flex-col gap-2 p-4">
      {mainNavLinks.map(renderLink)}
      
      <Separator className="my-1" />
      
      {accountingNavLinks.map(renderLink)}

      <Separator className="my-1" />
      
      <h3 className="px-3 text-xs font-semibold text-muted-foreground/80 tracking-wider">RAPPORTS</h3>
      {reportLinks.map(renderLink)}
      <Separator className="my-1" />
      {financeNavLinks.map(renderLink)}
      
      <Separator className="my-1" />
      <h3 className="px-3 text-xs font-semibold text-muted-foreground/80 tracking-wider">DIVERS</h3>
    </nav>
  );
}
