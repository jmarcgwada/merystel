

'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star, RefreshCw, ChevronDown, ChevronRight, Building, Mail, Phone, Notebook, Banknote, MapPin, ArrowLeft, ArrowRight, Fingerprint, LayoutDashboard, SlidersHorizontal, X, FilePen } from 'lucide-react';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

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

function CustomersPageContent() {
  const { customers, deleteCustomer, setDefaultCustomer, isLoading, itemsPerPage, setItemsPerPage } = usePos();
  const searchParams = useSearchParams();
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setEditCustomerOpen] = useState(false);

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [filter, setFilter] = useState(searchParams.get('filter') || '');
  const [filterPostalCode, setFilterPostalCode] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterIsDisabled, setFilterIsDisabled] = useState<'no' | 'yes' | 'all'>('no');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setFilter(filterParam);
      // Automatically open the detail view for the filtered customer
      setTimeout(() => {
        setOpenCollapsibles({ [filterParam]: true });
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    setItemsPerPageState(itemsPerPage);
  }, [itemsPerPage]);


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
    customers?.filter(c => {
        if (!c) return false;
        const lowerFilter = filter.toLowerCase();

        const nameMatch = c.name && c.name.toLowerCase().includes(lowerFilter);
        const idMatch = c.id && c.id.toLowerCase().includes(lowerFilter);
        const postalCodeMatch = !filterPostalCode || (c.postalCode && c.postalCode.toLowerCase().includes(filterPostalCode.toLowerCase()));
        const phoneMatch = !filterPhone || (c.phone && c.phone.includes(filterPhone)) || (c.phone2 && c.phone2.includes(filterPhone));
        const addressMatch = !filterAddress || (c.address && c.address.toLowerCase().includes(filterAddress.toLowerCase()));
        const emailMatch = !filterEmail || (c.email && c.email.toLowerCase().includes(filterEmail.toLowerCase()));
        const disabledMatch = filterIsDisabled === 'all' || (c.isDisabled ? 'yes' : 'no') === filterIsDisabled;
        
        return (nameMatch || idMatch) && postalCodeMatch && phoneMatch && addressMatch && emailMatch && disabledMatch;
    }) || [],
  [customers, filter, filterPostalCode, filterPhone, filterAddress, filterEmail, filterIsDisabled]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({...prev, [id]: !prev[id]}));
  }
  
  const resetFilters = () => {
    setFilter('');
    setFilterPostalCode('');
    setFilterPhone('');
    setFilterAddress('');
    setFilterEmail('');
    setFilterIsDisabled('no');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(paginatedCustomers.map(customer => customer.id));
    } else {
      setSelectedCustomerIds([]);
    }
  };

  const handleSelectItem = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(prev => [...prev, customerId]);
    } else {
      setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
    }
  };

  return (
    <>
      <PageHeader 
        title="Gérer les clients" 
        subtitle={isClient && customers ? `Page ${currentPage} sur ${totalPages} (${filteredCustomers.length} clients sur ${customers.length} au total)` : "Affichez et gérez votre liste de clients."}
      >
        <div className="flex items-center gap-2">
            {selectedCustomerIds.length > 0 && (
                <Button asChild>
                    <Link href={`/management/customers/bulk-edit?ids=${selectedCustomerIds.join(',')}`}>
                        <FilePen className="mr-2 h-4 w-4" />
                        Modifier la sélection ({selectedCustomerIds.length})
                    </Link>
                </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild size="icon" className="btn-back">
                <Link href="/dashboard">
                    <LayoutDashboard />
                </Link>
            </Button>
            <Button onClick={() => setAddCustomerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un client
            </Button>
        </div>
      </PageHeader>
       <div className="mt-8">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} asChild>
          <Card className="mb-4">
               <CardHeader className="p-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                      <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="justify-start px-2 text-lg font-semibold">
                              <SlidersHorizontal className="h-4 w-4 mr-2" />
                              Filtres
                          </Button>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                           <Input 
                              placeholder="Rechercher par nom ou code..."
                              value={filter}
                              onChange={(e) => {
                                setFilter(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="max-w-xs h-9"
                          />
                           <Select value={filterIsDisabled} onValueChange={(value) => { setFilterIsDisabled(value as any); setCurrentPage(1); }}>
                              <SelectTrigger className="w-[180px] h-9">
                                  <SelectValue placeholder="Statut du client" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="no">Clients activés</SelectItem>
                                  <SelectItem value="yes">Clients désactivés</SelectItem>
                                  <SelectItem value="all">Tous les clients</SelectItem>
                              </SelectContent>
                          </Select>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={resetFilters}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Réinitialiser les filtres</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                           <div className="flex items-center gap-1 shrink-0">
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-9 text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">
                                        Page {currentPage} / {totalPages || 1}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="items-per-page-slider" className="text-sm">Lignes par page</Label>
                                         <div className="flex justify-between items-center text-sm font-bold text-primary">
                                            <span>{itemsPerPageState}</span>
                                        </div>
                                        <Slider
                                            id="items-per-page-slider"
                                            value={[itemsPerPageState]}
                                            onValueChange={(value) => setItemsPerPageState(value[0])}
                                            onValueCommit={(value) => setItemsPerPage(value[0])}
                                            min={5}
                                            max={Math.min(100, Math.max(5, filteredCustomers.length))}
                                            step={5}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                       </div>
                  </div>
              </CardHeader>
               <CollapsibleContent>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-0">
                      <Input placeholder="Filtrer par code postal..." value={filterPostalCode} onChange={(e) => { setFilterPostalCode(e.target.value); setCurrentPage(1); }} className="h-9" />
                      <Input placeholder="Filtrer par téléphone..." value={filterPhone} onChange={(e) => { setFilterPhone(e.target.value); setCurrentPage(1); }} className="h-9" />
                      <Input placeholder="Filtrer par adresse..." value={filterAddress} onChange={(e) => { setFilterAddress(e.target.value); setCurrentPage(1); }} className="h-9" />
                      <Input placeholder="Filtrer par email..." value={filterEmail} onChange={(e) => { setFilterEmail(e.target.value); setCurrentPage(1); }} className="h-9" />
                  </CardContent>
               </CollapsibleContent>
          </Card>
        </Collapsible>
        <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-12">
                              <Checkbox
                                checked={selectedCustomerIds.length === paginatedCustomers.length && paginatedCustomers.length > 0}
                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                              />
                          </TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead className="w-[200px] text-right">Actions</TableHead>
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
                      ) : paginatedCustomers.length > 0 ? (
                        paginatedCustomers.map(customer => (
                          <React.Fragment key={customer.id}>
                              <TableRow className={cn("hover:bg-muted/50", customer.isDisabled && "bg-muted/50 text-muted-foreground", selectedCustomerIds.includes(customer.id) && "bg-blue-50 dark:bg-blue-900/30")}>
                                  <TableCell>
                                      <Checkbox
                                        checked={selectedCustomerIds.includes(customer.id)}
                                        onCheckedChange={(checked) => handleSelectItem(customer.id, checked as boolean)}
                                      />
                                  </TableCell>
                                  <TableCell className="w-[50px]">
                                      <Button variant="ghost" size="icon" onClick={() => toggleCollapsible(customer.id)}>
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
                                    <TableCell colSpan={6} className="p-0">
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
                          </React.Fragment>
                        ))
                      ) : (
                         <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">Aucun client trouvé pour ces filtres.</TableCell>
                        </TableRow>
                      )}
                  </TableBody>
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

export default function CustomersPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <CustomersPageContent />
        </Suspense>
    )
}
