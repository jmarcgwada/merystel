
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, LayoutGrid, Users, CreditCard, Percent, Utensils, UserCog } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { useUser } from '@/firebase/auth/use-user';


export default function ManagementSideNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const isCashier = user?.role === 'cashier';

  const navLinks = [
    { href: '/management/items', label: 'Articles', icon: Box, cashierVisible: true },
    { href: '/management/categories', label: 'Catégories', icon: LayoutGrid, cashierVisible: true },
    { href: '/management/tables', label: 'Tables', icon: Utensils, cashierVisible: !isCashier },
    { href: '/management/customers', label: 'Clients', icon: Users, cashierVisible: !isCashier },
    { href: '/management/payment-methods', label: 'Paiements', icon: CreditCard, cashierVisible: !isCashier },
    { href: '/management/vat', label: 'TVA', icon: Percent, cashierVisible: !isCashier },
    { href: '/management/users', label: 'Utilisateurs', icon: UserCog, cashierVisible: !isCashier },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {navLinks.map((link) => (
        link.cashierVisible && (
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
        )
      ))}
    </nav>
  );
}
