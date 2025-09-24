import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function ItemsPage() {
  return (
    <>
      <PageHeader title="Manage Items" subtitle="Add, edit, or remove products.">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </PageHeader>
      <Card className="mt-8">
        <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-16">
                <p>Item management interface will be here.</p>
                <p>Features will include adding, editing, and deleting items.</p>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
