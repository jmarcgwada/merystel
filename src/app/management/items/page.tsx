
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AddItemDialog } from './components/add-item-dialog';
import { usePos } from '@/contexts/pos-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function ItemsPage() {
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const { items, categories } = usePos();

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  }

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Image 
                        src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} 
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                        data-ai-hint="product image"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{getCategoryName(item.categoryId)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.price.toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon">
                           <Edit className="h-4 w-4"/>
                       </Button>
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                           <Trash2 className="h-4 w-4"/>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
      <AddItemDialog isOpen={isAddItemOpen} onClose={() => setAddItemOpen(false)} />
    </>
  );
}
