'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, LayoutGrid, Users, CreditCard, Percent, Utensils, UserCog } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';

const navLinks = [
  { href: '/management/items', label: 'Articles', icon: Box, adminOnly: false },
  { href: '/management/categories', label: 'Catégories', icon: LayoutGrid, adminOnly: false },
  { href: '/management/tables', label: 'Tables', icon: Utensils, adminOnly: false },
  { href: '/management/customers', label: 'Clients', icon: Users, adminOnly: false },
  { href: '/management/payment-methods', label: 'Paiements', icon: CreditCard, adminOnly: false },
  { href: '/management/vat', label: 'TVA', icon: Percent, adminOnly: false },
  { href: '/management/users', label: 'Utilisateurs', icon: UserCog, adminOnly: true },
];

export default function ManagementSideNav() {
  const pathname = usePathname();
  const { user } = usePos();

  return (
    <nav className="flex flex-col gap-2">
      {navLinks.filter(link => !link.adminOnly || user?.role === 'admin').map((link) => (
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
