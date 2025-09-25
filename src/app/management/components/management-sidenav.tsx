
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, LayoutGrid, Users, CreditCard, Percent, Utensils, UserCog } from 'lucide-react';

const navLinks = [
  { href: '/management/items', label: 'Articles', icon: Box },
  { href: '/management/categories', label: 'Catégories', icon: LayoutGrid },
  { href: '/management/tables', label: 'Tables', icon: Utensils },
  { href: '/management/customers', label: 'Clients', icon: Users },
  { href: '/management/payment-methods', label: 'Paiements', icon: CreditCard },
  { href: '/management/vat', label: 'TVA', icon: Percent },
  // The users link is removed as authentication is disabled.
  // { href: '/management/users', label: 'Utilisateurs', icon: UserCog },
];

export default function ManagementSideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
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
    </nav>
  );
}
