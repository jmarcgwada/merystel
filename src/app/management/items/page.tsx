
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { AddItemDialog } from './components/add-item-dialog';

export default function ItemsPage() {
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  return (
    <>
      <PageHeader title="Gérer les articles" subtitle="Ajoutez, modifiez ou supprimez des produits.">
        <Button onClick={() => setAddItemOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un article
        </Button>
      </PageHeader>
      <Card className="mt-8">
        <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-16">
                <p>L'interface de gestion des articles sera ici.</p>
                <p>Les fonctionnalités incluront l'ajout, la modification et la suppression d'articles.</p>
            </div>
        </CardContent>
      </Card>
      <AddItemDialog isOpen={isAddItemOpen} onClose={() => setAddItemOpen(false)} />
    </>
  );
}
