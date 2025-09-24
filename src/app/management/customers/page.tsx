
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
      <PageHeader title="Gérer les clients" subtitle="Affichez et gérez votre liste de clients.">
        <Button onClick={() => setAddCustomerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </PageHeader>
       <Card className="mt-8">
        <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-16">
                <p>L'interface de gestion des clients sera ici.</p>
                <p>Les fonctionnalités incluront l'ajout de clients pour la facturation et le suivi.</p>
            </div>
        </CardContent>
      </Card>
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} />
    </>
  );
}
