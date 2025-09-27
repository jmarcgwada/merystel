

'use client';

import { PageHeader } from '@/components/page-header';
import { TableLayout } from './components/table-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';

export default function RestaurantPage() {
  const { restaurantModeBackgroundColor } = usePos();
  return (
    <div style={{ backgroundColor: restaurantModeBackgroundColor }} className="h-full">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Mode Restaurant"
          subtitle="Sélectionnez une table pour voir ou commencer une commande."
        >
          <Button asChild variant="outline" className="btn-back">
            <Link href="/dashboard">
              <ArrowLeft />
              Tableau de bord
            </Link>
          </Button>
        </PageHeader>
        <div className="mt-8">
          <TableLayout />
        </div>
      </div>
    </div>
  );
}
