

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, RefreshCw, ChevronDown, ChevronRight, Mail, Phone, Notebook, Banknote, MapPin, ArrowLeft, ArrowRight, Fingerprint, Globe, Building, LayoutDashboard } from 'lucide-react';
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
import type { Supplier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase/auth/use-user';
import { AddSupplierDialog } from '@/app/management/suppliers/components/add-supplier-dialog';
import { EditSupplierDialog } from '@/app/management/suppliers/components/edit-supplier-dialog';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import Link from 'next/link';

const ITEMS_PER_PAGE = 15;

const DetailItem = ({ icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
    if (!value) return null;
    const Icon = icon;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    )
}

export default function SuppliersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAddSupplierOpen, setAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setEditSupplierOpen] = useState(false);
  const { deleteSupplier, isLoading: isPosLoading } = usePos();

  const suppliersCollectionRef = useMemoFirebase(() => user ? collection(firestore, 'companies', 'main', 'suppliers') : null, [firestore, user]);
  const { data: suppliers, isLoading: isSuppliersLoading } = useCollection<Supplier>(suppliersCollectionRef);
  const isLoading = isPosLoading || isSuppliersLoading;
  
  const isCashier = user?.role === 'cashier';
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState('');
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteSupplier = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setSupplierToDelete(null);
    }
  }

  const handleOpenEditDialog = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setEditSupplierOpen(true);
  }

  const filteredSuppliers = useMemo(() => {
    if (!isClient || !suppliers) return [];
    return suppliers.filter(s => 
        s.name.toLowerCase().includes(filter.toLowerCase()) || 
        s.id.toLowerCase().includes(filter.toLowerCase()) ||
        (s.contactName && s.contactName.toLowerCase().includes(filter.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(filter.toLowerCase()))
    ) || [];
  },
  [suppliers, filter, isClient]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSuppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSuppliers, currentPage]);
  
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);

  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({...prev, [id]: !prev[id]}));
  }

  return (
    <>
      <PageHeader 
        title="Gérer les fournisseurs" 
        subtitle={isClient && suppliers ? `Page ${currentPage} sur ${totalPages} (${filteredSuppliers.length} fournisseurs sur ${suppliers.length} au total)` : "Affichez et gérez votre liste de fournisseurs."}
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
             <Button asChild variant="outline" size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
            {!isCashier && (
                <Button onClick={() => setAddSupplierOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un fournisseur
                </Button>
            )}
        </div>
      </PageHeader>
       <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                  <Input 
                    placeholder="Rechercher par nom, code, contact ou email..."
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-sm"
                  />
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} / {totalPages || 1}
                    </span>
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                      {isLoading ? (
                        <>
                          {Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={i}>
                                  <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                              </TableRow>
                          ))}
                        </>
                      ) : paginatedSuppliers.length > 0 ? (
                        paginatedSuppliers.map(supplier => (
                          <React.Fragment key={supplier.id}>
                              <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleCollapsible(supplier.id)}>
                                  <TableCell className="w-[50px]">
                                      <Button variant="ghost" size="icon">
                                          {openCollapsibles[supplier.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </Button>
                                  </TableCell>
                                  <TableCell className="font-medium">{supplier.name} <span className="font-mono text-xs text-muted-foreground ml-2">({supplier.id.slice(0,8)}...)</span></TableCell>
                                  <TableCell>{supplier.contactName}</TableCell>
                                  <TableCell>{supplier.email}</TableCell>
                                  <TableCell>{supplier.phone}</TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); !isCashier && handleOpenEditDialog(supplier)}} disabled={isCashier}>
                                          <Edit className="h-4 w-4"/>
                                      </Button>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => {e.stopPropagation(); !isCashier && setSupplierToDelete(supplier)}} disabled={isCashier}>
                                          <Trash2 className="h-4 w-4"/>
                                      </Button>
                                  </TableCell>
                              </TableRow>
                              {openCollapsibles[supplier.id] && (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-0">
                                    <div className="bg-secondary/50 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4"/>Coordonnées</h4>
                                            <DetailItem icon={Fingerprint} label="Code Fournisseur" value={supplier.id} />
                                            <DetailItem icon={Mail} label="Email" value={supplier.email} />
                                            <DetailItem icon={Phone} label="Téléphone" value={supplier.phone} />
                                            <DetailItem icon={MapPin} label="Adresse" value={supplier.address} />
                                            <DetailItem icon={MapPin} label="Ville / CP" value={supplier.city && supplier.postalCode ? `${supplier.city}, ${supplier.postalCode}` : supplier.city || supplier.postalCode} />
                                            <DetailItem icon={MapPin} label="Pays" value={supplier.country} />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="font-semibold flex items-center gap-2"><Building className="h-4 w-4"/>Entreprise</h4>
                                            <DetailItem icon={Fingerprint} label="SIRET" value={supplier.siret} />
                                            <DetailItem icon={Globe} label="Site Web" value={supplier.website} />
                                            <DetailItem icon={Banknote} label="IBAN" value={supplier.iban} />
                                            <DetailItem icon={Banknote} label="BIC / SWIFT" value={supplier.bic} />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="font-semibold flex items-center gap-2"><Notebook className="h-4 w-4"/>Notes</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.notes || 'Aucune note.'}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    </TableCell>
                                </TableRow>
                              )}
                          </React.Fragment>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">Aucun fournisseur trouvé.</TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
      <AddSupplierDialog isOpen={isAddSupplierOpen} onClose={() => setAddSupplierOpen(false)} />
      <EditSupplierDialog isOpen={isEditSupplierOpen} onClose={() => setEditSupplierOpen(false)} supplier={supplierToEdit} />
       <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fournisseur "{supplierToDelete?.name}" sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    