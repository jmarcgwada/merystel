
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { TableLayout } from './components/table-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddTableDialog } from './components/add-table-dialog';

export default function RestaurantPage() {
  const [isAddTableOpen, setAddTableOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Restaurant Mode"
        subtitle="Select a table to view or start an order."
      >
        <Button onClick={() => setAddTableOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </PageHeader>
      <div className="mt-8">
        <TableLayout />
      </div>
      <AddTableDialog isOpen={isAddTableOpen} onClose={() => setAddTableOpen(false)} />
    </div>
  );
}
