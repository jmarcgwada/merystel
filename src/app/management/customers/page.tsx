
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { AddCustomerDialog } from './components/add-customer-dialog';

export default function CustomersPage() {
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);

  return (
    <>
      <PageHeader title="Manage Customers" subtitle="View and manage your customer list.">
        <Button onClick={() => setAddCustomerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </PageHeader>
       <Card className="mt-8">
        <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-16">
                <p>Customer management interface will be here.</p>
                <p>Features will include adding customers for billing and tracking.</p>
            </div>
        </CardContent>
      </Card>
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} />
    </>
  );
}
