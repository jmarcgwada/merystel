import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ShoppingCart,
  UtensilsCrossed,
  Box,
  LayoutGrid,
  Users,
  Settings,
  ArrowRight,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Zenith POS',
};

const shortcuts = [
  {
    title: 'Point of Sale',
    href: '/pos',
    icon: ShoppingCart,
    description: 'Start a new transaction in touch mode.',
    section: 'sales',
  },
  {
    title: 'Restaurant Mode',
    href: '/restaurant',
    icon: UtensilsCrossed,
    description: 'Manage tables and restaurant orders.',
    section: 'sales',
  },
  {
    title: 'Manage Items',
    href: '/management/items',
    icon: Box,
    description: 'Add, edit, or remove products.',
    section: 'management',
  },
  {
    title: 'Manage Categories',
    href: '/management/categories',
    icon: LayoutGrid,
    description: 'Organize your items into categories.',
    section: 'management',
  },
  {
    title: 'Manage Customers',
    href: '/management/customers',
    icon: Users,
    description: 'View and manage your customer list.',
    section: 'management',
  },
  {
    title: 'Application Settings',
    href: '/settings',
    icon: Settings,
    description: 'Customize interface and system options.',
    section: 'settings',
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 bg-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
          Dashboard
        </h1>

        <div className="space-y-12">
          <div>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground font-headline">
              Sales & Orders
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shortcuts
                .filter((s) => s.section === 'sales')
                .map((shortcut) => (
                  <ShortcutCard key={shortcut.href} {...shortcut} />
                ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground font-headline">
              Business Management
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shortcuts
                .filter((s) => s.section === 'management')
                .map((shortcut) => (
                  <ShortcutCard key={shortcut.href} {...shortcut} />
                ))}
            </div>
          </div>
          
          <div>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground font-headline">
              System
            </h2>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shortcuts
                .filter((s) => s.section === 'settings')
                .map((shortcut) => (
                  <ShortcutCard key={shortcut.href} {...shortcut} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({
  title,
  href,
  icon: Icon,
  description,
}: {
  title: string;
  href: string;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 hover:border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium font-headline">{title}</CardTitle>
          <Icon className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-4 flex items-center text-sm font-semibold text-primary group-hover:text-accent-foreground">
            Go to {title}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
