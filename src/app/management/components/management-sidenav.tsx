
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, LayoutGrid, Users, CreditCard } from 'lucide-react';

const navLinks = [
  { href: '/management/items', label: 'Articles', icon: Box },
  { href: '/management/categories', label: 'Catégories', icon: LayoutGrid },
  { href: '/management/customers', label: 'Clients', icon: Users },
  { href: '/management/payment-methods', label: 'Paiements', icon: CreditCard },
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
            pathname === link.href && 'bg-secondary text-primary'
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
