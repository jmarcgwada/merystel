
'use client';

import React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SupportTicketsPage() {
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
            <CardDescription>
                Cette section est en cours de développement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Matériel</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            Aucune prise en charge pour le moment.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
