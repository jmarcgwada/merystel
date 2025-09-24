
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { AddCategoryDialog } from './components/add-category-dialog';

export default function CategoriesPage() {
  const [isAddCategoryOpen, setAddCategoryOpen] = useState(false);

  return (
    <>
      <PageHeader title="Gérer les catégories" subtitle="Organisez vos articles en catégories.">
        <Button onClick={() => setAddCategoryOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une catégorie
        </Button>
      </PageHeader>
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-16">
            <p>L'interface de gestion des catégories sera ici.</p>
            <p>Les fonctionnalités incluront la personnalisation de l'apparence (couleur, image, etc.).</p>
          </div>
        </CardContent>
      </Card>
      <AddCategoryDialog isOpen={isAddCategoryOpen} onClose={() => setAddCategoryOpen(false)} />
    </>
  );
}
