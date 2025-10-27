
'use client';

import { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Sale } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UnpaidInvoicesPage() {
  const { sales, customers, isLoading } = usePos();
  const router = useRouter();

  const unpaidInvoices = useMemo(() => {
    if (!sales) return [];
    return sales
      .filter((sale) => sale.status === 'pending' && sale.documentType === 'invoice')
      .sort((a, b) => new Date(a.date as any).getTime() - new Date(b.date as any).getTime());
  }, [sales]);

  const getCustomerName = useCallback(
    (customerId?: string) => {
      if (!customerId || !customers) return 'N/A';
      return customers.find((c) => c.id === customerId)?.name || 'Client supprimé';
    },
    [customers]
  );
  
  const handleEdit = (saleId: string) => {
    router.push(`/commercial/invoices?edit=${saleId}`);
  };

  const totalAmountDue = useMemo(() => {
    return unpaidInvoices.reduce((acc, sale) => {
        const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
        return acc + (sale.total - totalPaid);
    }, 0);
  }, [unpaidInvoices]);


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Factures Impayées"
        subtitle={`Suivi de ${unpaidInvoices.length} factures en attente de paiement.`}
      >
        <div className="flex items-center gap-2">
            <Card className="p-2 text-center">
                <p className="text-xs text-muted-foreground">Montant total dû</p>
                <p className="text-lg font-bold text-destructive">{totalAmountDue.toFixed(2)}€</p>
            </Card>
          <Button asChild variant="outline" className="btn-back">
            <Link href="/dashboard">
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        </div>
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date d'échéance</TableHead>
                  <TableHead>Montant Dû</TableHead>
                  <TableHead>Niveau de Relance</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6} className="h-12" /></TableRow>
                ))}
                {!isLoading && unpaidInvoices.map((sale) => {
                    const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
                    const amountDue = sale.total - totalPaid;
                    return (
                        <TableRow key={sale.id}>
                            <TableCell>
                                <Link href={`/reports/${sale.id}?from=unpaid`} className="font-medium text-primary hover:underline">
                                    {sale.ticketNumber}
                                </Link>
                            </TableCell>
                            <TableCell>{getCustomerName(sale.customerId)}</TableCell>
                            <TableCell>
                                <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" />
                            </TableCell>
                            <TableCell className="font-semibold text-destructive">
                                {amountDue.toFixed(2)}€
                            </TableCell>
                            <TableCell>
                                <Badge variant={sale.dunningLevel ? "default" : "outline"}>
                                    Niveau {sale.dunningLevel || 0}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleEdit(sale.id)}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Relance par Email
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Enregistrer un Appel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            Envoyer un WhatsApp
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
            {!isLoading && unpaidInvoices.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Aucune facture impayée pour le moment.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
