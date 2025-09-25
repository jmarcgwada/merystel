
'use client';

import { PageHeader } from '@/components/page-header';
import { TableLayout } from './components/table-layout';

export default function RestaurantPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Mode Restaurant"
        subtitle="Sélectionnez une table pour voir ou commencer une commande."
      />
      <div className="mt-8">
        <TableLayout />
      </div>
    </div>
  );
}
