'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, ArrowLeft, ArrowUpDown, ChevronDown, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePos } from '@/contexts/pos-context';
import type { SupportTicket } from '@/lib/types';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type SortKey = 'ticketNumber' | 'customerName' | 'equipmentType' | 'createdAt' | 'status';

export default function SupportTicketsPage() {
  const { supportTickets, isLoading } = usePos();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

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

  const toggleDetails = (id: string) => {
    setOpenDetails(prev => ({...prev, [id]: !prev[id]}));
  };

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
                        <TableHead className="w-[50px]"></TableHead>
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
                                <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                           </TableRow>
                        ))
                    ) : sortedTickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                Aucune prise en charge pour le moment.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedTickets.map(ticket => (
                           <React.Fragment key={ticket.id}>
                                <TableRow className="cursor-pointer" onClick={() => toggleDetails(ticket.id)}>
                                    <TableCell>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", openDetails[ticket.id] && 'rotate-180')}/>
                                    </TableCell>
                                    <TableCell className="font-mono">{ticket.ticketNumber}</TableCell>
                                    <TableCell>{ticket.customerName}</TableCell>
                                    <TableCell>{ticket.equipmentBrand} {ticket.equipmentModel}</TableCell>
                                    <TableCell>
                                        <ClientFormattedDate date={ticket.createdAt} formatString="d MMM yyyy, HH:mm" />
                                    </TableCell>
                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem disabled>Modifier</DropdownMenuItem>
                                                <DropdownMenuItem disabled>Supprimer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                {openDetails[ticket.id] && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0">
                                            <div className="bg-muted/50 p-6 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Panne & Devis</h4>
                                                        <p className="text-sm text-muted-foreground">{ticket.issueDescription}</p>
                                                        {ticket.amount && <p className="font-bold text-lg">{ticket.amount.toFixed(2)}€</p>}
                                                    </div>
                                                     <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Observations client</h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.clientNotes || 'Aucune.'}</p>
                                                    </div>
                                                     <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Observations sur le matériel</h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.equipmentNotes || 'Aucune.'}</p>
                                                    </div>
                                                     <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Notes internes</h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.notes || 'Aucune.'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                           </React.Fragment>
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
