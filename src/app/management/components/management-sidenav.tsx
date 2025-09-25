
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, LayoutGrid, Users, CreditCard, Percent, Utensils, UserCog } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';

const navLinks = [
  { href: '/management/items', label: 'Articles', icon: Box, roles: ['admin', 'manager'] },
  { href: '/management/categories', label: 'Catégories', icon: LayoutGrid, roles: ['admin', 'manager'] },
  { href: '/management/tables', label: 'Tables', icon: Utensils, roles: ['admin', 'manager'] },
  { href: '/management/customers', label: 'Clients', icon: Users, roles: ['admin', 'manager'] },
  { href: '/management/payment-methods', label: 'Paiements', icon: CreditCard, roles: ['admin', 'manager'] },
  { href: '/management/vat', label: 'TVA', icon: Percent, roles: ['admin', 'manager'] },
  { href: '/management/users', label: 'Utilisateurs', icon: UserCog, roles: ['admin'] },
];

export default function ManagementSideNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const userRole = user?.role || 'cashier';

  return (
    <nav className="flex flex-col gap-2">
      {navLinks.filter(link => link.roles.includes(userRole)).map((link) => (
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
