
'use client';

import { PageHeader } from '@/components/page-header';
import { TableLayout } from './components/table-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

export default function RestaurantPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Mode Restaurant"
        subtitle="Sélectionnez une table pour voir ou commencer une commande."
      >
        <Button asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Tableau de bord
          </Link>
        </Button>
      </PageHeader>
      <div className="mt-8">
        <TableLayout />
      </div>
    </div>
  );
}
