'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, RefreshCw, ChevronDown, ChevronRight, Building, Mail, Phone, Notebook, Banknote, MapPin, ArrowLeft, ArrowRight, Fingerprint } from 'lucide-react';
import { AddCustomerDialog } from './components/add-customer-dialog';
import { EditCustomerDialog } from './components/edit-customer-dialog';
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
import type { Customer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

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

export default function CustomersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);
  const { deleteCustomer, setDefaultCustomer, isLoading: isPosLoading } = usePos();
  
  const customersCollectionRef = useMemoFirebase(() => user ? collection(firestore, 'companies', 'main', 'customers') : null, [firestore, user]);
  const { data: customers, isLoading: isCustomersLoading } = useCollection<Customer>(customersCollectionRef);
  const isLoading = isPosLoading || isCustomersLoading;

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState('');
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  }

  const handleOpenEditDialog = (customer: Customer) => {
    setCustomerToEdit(customer);
    setEditCustomerOpen(true);
  }

  const filteredCustomers = useMemo(() => 
    customers?.filter(c => 
        c.name.toLowerCase().includes(filter.toLowerCase()) || 
        (c.email && c.email.toLowerCase().includes(filter.toLowerCase())) ||
        c.id.toLowerCase().includes(filter.toLowerCase())
    ) || [],
  [customers, filter]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);
  
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({...prev, [id]: !prev[id]}));
  }

  return (
    <>
      <PageHeader 
        title="Gérer les clients" 
        subtitle={isClient && customers ? `Page ${currentPage} sur ${totalPages} (${filteredCustomers.length} clients sur ${customers.length} au total)` : "Affichez et gérez votre liste de clients."}
      >
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={() => setAddCustomerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </PageHeader>
       <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                  <Input 
                    placeholder="Rechercher par nom, email ou code client..."
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page on new search
                    }}
                    className="max-w-sm"
                  />
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} / {totalPages}
                    </span>
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead className="w-[160px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  
                  {(isLoading || !isClient) && (
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                  )}
                  {isClient && !isLoading && paginatedCustomers && paginatedCustomers.map(customer => (
                      <TableBody key={customer.id} className="border-b">
                          <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleCollapsible(customer.id)}>
                              <TableCell className="w-[50px]">
                                  <Button variant="ghost" size="icon">
                                      {openCollapsibles[customer.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </Button>
                              </TableCell>
                              <TableCell className="font-medium">{customer.name} <span className="font-mono text-xs text-muted-foreground ml-2">({customer.id.slice(0,8)}...)</span></TableCell>
                              <TableCell>{customer.email}</TableCell>
                              <TableCell>{customer.phone}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); setDefaultCustomer(customer.id)}}>
                                      <Star className={cn("h-4 w-4", customer.isDefault ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground')} />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleOpenEditDialog(customer)}}>
                                      <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => {e.stopPropagation(); setCustomerToDelete(customer)}}>
                                      <Trash2 className="h-4 w-4"/>
                                  </Button>
                              </TableCell>
                          </TableRow>
                          {openCollapsibles[customer.id] && (
                             <TableRow>
                                <TableCell colSpan={5} className="p-0">
                                  <div className="bg-secondary/50 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4"/>Coordonnées</h4>
                                        <DetailItem icon={Fingerprint} label="Code Client" value={customer.id} />
                                        <DetailItem icon={Mail} label="Email" value={customer.email} />
                                        <DetailItem icon={Phone} label="Téléphone" value={customer.phone} />
                                        <DetailItem icon={Phone} label="Téléphone 2" value={customer.phone2} />
                                        <DetailItem icon={MapPin} label="Adresse" value={customer.address} />
                                        <DetailItem icon={MapPin} label="Ville / CP" value={customer.city && customer.postalCode ? `${customer.city}, ${customer.postalCode}` : customer.city || customer.postalCode} />
                                        <DetailItem icon={MapPin} label="Pays" value={customer.country} />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4"/>Finances</h4>
                                        <DetailItem icon={Banknote} label="IBAN" value={customer.iban} />
                                    </div>
                                     <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2"><Notebook className="h-4 w-4"/>Notes</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes || 'Aucune note.'}</p>
                                    </div>
                                  </div>
                                  <Separator />
                                </TableCell>
                             </TableRow>
                          )}
                      </TableBody>
                  ))}
                  
              </Table>
          </CardContent>
        </Card>
      </div>
      <AddCustomerDialog isOpen={isAddCustomerOpen} onClose={() => setAddCustomerOpen(false)} />
      <EditCustomerDialog isOpen={isEditCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={customerToEdit} />
       <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client "{customerToDelete?.name}" sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
