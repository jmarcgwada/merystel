'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, ArrowLeft, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePos } from '@/contexts/pos-context';
import type { SupportTicket } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type SortKey = 'ticketNumber' | 'customerName' | 'equipmentType' | 'createdAt' | 'status';

export default function SupportTicketsPage() {
  const { supportTickets, isLoading } = usePos();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

  const sortedTickets = useMemo(() => {
    if (!supportTickets) return [];
    const sortable = [...supportTickets];
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'createdAt') {
          aValue = new Date(a[sortConfig.key]).getTime();
          bValue = new Date(b[sortConfig.key]).getTime();
        } else {
          aValue = a[sortConfig.key as keyof SupportTicket] || '';
          bValue = b[sortConfig.key as keyof SupportTicket] || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortable;
  }, [supportTickets, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  }

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch(status) {
      case 'Ouvert': return <Badge variant="secondary">{status}</Badge>;
      case 'En cours': return <Badge className="bg-blue-500 text-white">{status}</Badge>;
      case 'En attente de pièces': return <Badge className="bg-yellow-500 text-white">{status}</Badge>;
      case 'Terminé': return <Badge className="bg-green-500 text-white">{status}</Badge>;
      case 'Facturé': return <Badge variant="outline">{status}</Badge>;
      case 'Annulé': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }


  return (
    <>
      <PageHeader
        title="Prises en Charge"
        subtitle="Consultez et gérez toutes les fiches de prise en charge."
      >
        <div className="flex items-center gap-2">
           <Button asChild>
            <Link href="/management/support-tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Prise en Charge
            </Link>
           </Button>
           <Button asChild variant="outline" className="btn-back">
            <Link href="/management/items">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Link>
           </Button>
        </div>
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Liste des Prises en Charge</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('ticketNumber')}>Numéro {getSortIcon('ticketNumber')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('customerName')}>Client {getSortIcon('customerName')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('equipmentType')}>Matériel {getSortIcon('equipmentType')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('createdAt')}>Date {getSortIcon('createdAt')}</Button></TableHead>
                        <TableHead><Button variant="ghost" onClick={() => requestSort('status')}>Statut {getSortIcon('status')}</Button></TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i}>
                                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                           </TableRow>
                        ))
                    ) : sortedTickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                Aucune prise en charge pour le moment.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-mono">{ticket.ticketNumber}</TableCell>
                                <TableCell>{ticket.customerName}</TableCell>
                                <TableCell>{ticket.equipmentBrand} {ticket.equipmentModel}</TableCell>
                                <TableCell>
                                    <ClientFormattedDate date={ticket.createdAt} formatString="d MMM yyyy, HH:mm" />
                                </TableCell>
                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Détails</Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
