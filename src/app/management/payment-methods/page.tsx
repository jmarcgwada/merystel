
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { usePos } from '@/contexts/pos-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Wallet, Landmark, Pencil, StickyNote } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';
import { Icon } from 'lucide-react';

const iconMap: { [key: string]: Icon } = {
  card: CreditCard,
  cash: Wallet,
  check: StickyNote,
  other: Landmark
};

export default function PaymentMethodsPage() {
  const { paymentMethods } = usePos();

  const getIcon = (iconName?: string) => {
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    return Landmark;
  }

  return (
    <>
      <PageHeader title="Gérer les moyens de paiement" subtitle="Configurez les options de paiement disponibles lors de l'encaissement." />
       <Card className="mt-8">
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Nom</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentMethods.map((method: PaymentMethod) => {
                        const IconComponent = getIcon(method.icon);
                        return (
                            <TableRow key={method.id}>
                                <TableCell>
                                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                                </TableCell>
                                <TableCell className="font-medium">{method.name}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  );
}
