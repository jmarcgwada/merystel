
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
      <PageHeader title="Manage Categories" subtitle="Organize your items into categories.">
        <Button onClick={() => setAddCategoryOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-16">
            <p>Category management interface will be here.</p>
            <p>Features will include customization of appearance (color, image, etc.).</p>
          </div>
        </CardContent>
      </Card>
      <AddCategoryDialog isOpen={isAddCategoryOpen} onClose={() => setAddCategoryOpen(false)} />
    </>
  );
}
