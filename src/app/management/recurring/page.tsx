
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { History, Edit, Trash2, ArrowLeft, AlertCircle, FileCog } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Sale } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';


export default function RecurringInvoicesPage() {
  const { sales, customers, isLoading, updateSale, recordCommercialDocument, generateSingleRecurringInvoice } = usePos();
  const router = useRouter();
  const { toast } = useToast();

  const [saleToModify, setSaleToModify] = useState<Sale | null>(null);
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [generationNote, setGenerationNote] = useState('');
  
  const [saleToGenerate, setSaleToGenerate] = useState<Sale | null>(null);
  const [isSingleGenerateConfirmOpen, setSingleGenerateConfirmOpen] = useState(false);

  const recurringSales = useMemo(() => {
    return sales?.filter(s => s.isRecurring).sort((a,b) => new Date(a.date as any).getTime() - new Date(b.date as any).getTime()) || [];
  }, [sales]);
  
  const dueInvoices = useMemo(() => {
    const now = new Date();
    return recurringSales.filter(s => 
      s.recurrence?.isActive &&
      s.recurrence?.nextDueDate &&
      new Date(s.recurrence.nextDueDate as any) <= now
    );
  }, [recurringSales]);

  const getCustomerName = useCallback((customerId?: string) => {
    if (!customerId || !customers) return 'N/A';
    return customers.find(c => c.id === customerId)?.name || 'Client supprimé';
  }, [customers]);

  const handleToggleActive = (sale: Sale) => {
    if (!sale.recurrence) return;
    updateSale({
      ...sale,
      recurrence: {
        ...sale.recurrence,
        isActive: !sale.recurrence.isActive,
      }
    });
  };
  
  const handleDeleteRecurrence = () => {
    if(!saleToModify) return;
    updateSale({
      ...saleToModify,
      isRecurring: false,
      recurrence: undefined,
    });
    setConfirmDeleteOpen(false);
    setSaleToModify(null);
  }

  const handleEdit = (sale: Sale) => {
    router.push(`/reports/${sale.id}?from=recurring`);
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? dueInvoices.map(s => s.id) : []);
  }

  const handleGenerateSelected = async () => {
    setGenerateConfirmOpen(false);
    toast({ title: "Génération en cours...", description: "Veuillez patienter." });

    const selectedSales = recurringSales.filter(s => selectedIds.includes(s.id));

    for (const sale of selectedSales) {
        await recordCommercialDocument({ ...sale, status: 'pending', notes: generationNote || undefined }, 'invoice');
    }
    
    setGenerationNote('');
    toast({ title: "Génération terminée", description: `${selectedSales.length} factures ont été créées.` });
    setSelectedIds([]);
  }
  
  const handleGenerateSingle = async () => {
    if (!saleToGenerate) return;
    
    setSingleGenerateConfirmOpen(false);
    toast({ title: "Génération en cours..." });
    
    await generateSingleRecurringInvoice(saleToGenerate.id, generationNote);
    
    setSaleToGenerate(null);
    setGenerationNote('');
  };


  return (
    <>
      <PageHeader
        title="Factures Récurrentes"
        subtitle={`Vous avez ${recurringSales.length} factures récurrentes configurées.`}
      >
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="btn-back">
                <Link href="/management/items">
                    <ArrowLeft />
                    Retour à la gestion
                </Link>
            </Button>
        </div>
      </PageHeader>
      
      {dueInvoices.length > 0 && (
        <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <p className="font-semibold">{dueInvoices.length} facture(s) récurrente(s) sont arrivées à échéance.</p>
                </div>
                <Button onClick={() => setGenerateConfirmOpen(true)} disabled={selectedIds.length === 0}>
                    <FileCog className="mr-2 h-4 w-4" />
                    Générer les {selectedIds.length} factures
                </Button>
            </CardContent>
        </Card>
      )}

       <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-12">
                              <Checkbox
                                  checked={selectedIds.length === dueInvoices.length && dueInvoices.length > 0}
                                  onCheckedChange={handleSelectAll}
                                  disabled={dueInvoices.length === 0}
                                />
                          </TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Pièce d'origine</TableHead>
                          <TableHead>Fréquence</TableHead>
                          <TableHead>Prochaine Échéance</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-[150px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading && Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                          </TableRow>
                      ))}
                      {!isLoading && recurringSales.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">Aucune facture récurrente configurée.</TableCell>
                          </TableRow>
                      )}
                      {!isLoading && recurringSales.map(sale => {
                        const isDue = dueInvoices.some(due => due.id === sale.id);
                        return (
                          <TableRow key={sale.id} className={cn(isDue && "bg-blue-50")}>
                              <TableCell>
                                <Checkbox 
                                    checked={selectedIds.includes(sale.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedIds(prev => checked ? [...prev, sale.id] : prev.filter(id => id !== sale.id))
                                    }}
                                    disabled={!isDue}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{getCustomerName(sale.customerId)}</TableCell>
                              <TableCell>
                                <Link href={`/reports/${sale.id}?from=recurring`} className="text-blue-600 hover:underline">
                                    {sale.ticketNumber}
                                </Link>
                              </TableCell>
                              <TableCell className="capitalize">{sale.recurrence?.frequency}</TableCell>
                              <TableCell>
                                {sale.recurrence?.nextDueDate ? <ClientFormattedDate date={sale.recurrence.nextDueDate} formatString="d MMMM yyyy" /> : '-'}
                              </TableCell>
                               <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={sale.recurrence?.isActive ?? false}
                                    onCheckedChange={() => handleToggleActive(sale)}
                                  />
                                  <Badge variant={sale.recurrence?.isActive ? 'default' : 'outline'}>
                                    {sale.recurrence?.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" title="Générer maintenant" onClick={(e) => { e.stopPropagation(); setSaleToGenerate(sale); setSingleGenerateConfirmOpen(true); }}>
                                    <FileCog className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                                      <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setSaleToModify(sale); setConfirmDeleteOpen(true); }}>
                                      <Trash2 className="h-4 w-4"/>
                                  </Button>
                              </TableCell>
                          </TableRow>
                        )}
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la configuration de récurrence pour la pièce "{saleToModify?.ticketNumber}", mais ne supprimera pas la pièce elle-même.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToModify(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecurrence} className="bg-destructive hover:bg-destructive/90">Supprimer la récurrence</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog open={isGenerateConfirmOpen} onOpenChange={setGenerateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la génération ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez créer {selectedIds.length} nouvelle(s) facture(s). Vous pouvez ajouter une note commune.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="generation-note">Note pour les factures (optionnel)</Label>
            <Textarea 
              id="generation-note"
              placeholder="Ex: Facturation pour le mois de Novembre 2025"
              value={generationNote}
              onChange={(e) => setGenerationNote(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateSelected}>
                Confirmer et Générer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isSingleGenerateConfirmOpen} onOpenChange={setSingleGenerateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Générer une facture manuellement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez créer une nouvelle facture basée sur le modèle "{saleToGenerate?.ticketNumber}". La date de prochaine échéance ne sera pas modifiée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="single-generation-note">Note pour la facture (optionnel)</Label>
            <Textarea 
              id="single-generation-note"
              placeholder="Ex: Facturation anticipée..."
              value={generationNote}
              onChange={(e) => setGenerationNote(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateSingle}>
                Confirmer et Générer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
