
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, ArrowLeft, LayoutDashboard, RefreshCw, Wrench } from 'lucide-react';
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
import type { RepairActionPreset, EquipmentType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ServiceSettingsPage() {
  const { 
    repairActionPresets, addRepairActionPreset, updateRepairActionPreset, deleteRepairActionPreset,
    equipmentTypes, addEquipmentType, updateEquipmentType, deleteEquipmentType,
    isLoading 
  } = usePos();
  const router = useRouter();

  // State for Repair Action Presets
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionToEdit, setActionToEdit] = useState<RepairActionPreset | null>(null);
  const [actionToDelete, setActionToDelete] = useState<RepairActionPreset | null>(null);
  const [actionName, setActionName] = useState('');

  // State for Equipment Types
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<EquipmentType | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<EquipmentType | null>(null);
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentPrice, setEquipmentPrice] = useState('');


  const handleOpenActionDialog = (preset?: RepairActionPreset) => {
    if (preset) {
      setActionToEdit(preset);
      setActionName(preset.name);
    } else {
      setActionToEdit(null);
      setActionName('');
    }
    setIsActionDialogOpen(true);
  };

  const handleSaveAction = () => {
    if (!actionName.trim()) return;
    if (actionToEdit) {
      updateRepairActionPreset({ ...actionToEdit, name: actionName });
    } else {
      addRepairActionPreset({ name: actionName });
    }
    setIsActionDialogOpen(false);
  };
  
  const handleDeleteAction = () => {
    if(actionToDelete) {
        deleteRepairActionPreset(actionToDelete.id);
        setActionToDelete(null);
    }
  }

  const handleOpenEquipmentDialog = (equipment?: EquipmentType) => {
    if (equipment) {
      setEquipmentToEdit(equipment);
      setEquipmentName(equipment.name);
      setEquipmentPrice(String(equipment.price));
    } else {
      setEquipmentToEdit(null);
      setEquipmentName('');
      setEquipmentPrice('');
    }
    setIsEquipmentDialogOpen(true);
  };

  const handleSaveEquipment = () => {
    if (!equipmentName.trim() || !equipmentPrice) return;
    const price = parseFloat(equipmentPrice);
    if (isNaN(price)) return;

    if (equipmentToEdit) {
      updateEquipmentType({ ...equipmentToEdit, name: equipmentName, price });
    } else {
      addEquipmentType({ name: equipmentName, price });
    }
    setIsEquipmentDialogOpen(false);
  };

  const handleDeleteEquipment = () => {
    if (equipmentToDelete) {
      deleteEquipmentType(equipmentToDelete.id);
      setEquipmentToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Paramètres SAV"
        subtitle="Gérez les actions de réparation rapides et les types de matériel."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild variant="outline" className="btn-back">
                <Link href="/management/items">
                    <ArrowLeft />
                    Retour
                </Link>
            </Button>
        </div>
      </PageHeader>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Actions de Réparation Prédéfinies</CardTitle>
            <Button onClick={() => handleOpenActionDialog()} size="sm" className="absolute top-4 right-4">
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader><TableRow><TableHead>Nom de l'action</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                      {isLoading && Array.from({length: 3}).map((_, i) => (
                          <TableRow key={i}><TableCell colSpan={2}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                      ))}
                      {!isLoading && repairActionPresets.map(preset => (
                          <TableRow key={preset.id}>
                              <TableCell className="font-medium">{preset.name}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenActionDialog(preset)}><Edit className="h-4 w-4"/></Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setActionToDelete(preset)}><Trash2 className="h-4 w-4"/></Button>
                              </TableCell>
                          </TableRow>
                      ))}
                      {!isLoading && repairActionPresets.length === 0 && (
                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Aucune action définie.</TableCell></TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Types de Matériel</CardTitle>
            <Button onClick={() => handleOpenEquipmentDialog()} size="sm" className="absolute top-4 right-4">
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead className="text-right">Tarif de Prise en Charge</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading && Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ))}
                {!isLoading && equipmentTypes.map(type => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-right font-semibold">{type.price.toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEquipmentDialog(type)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setEquipmentToDelete(type)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && equipmentTypes.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-24">Aucun type de matériel défini.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionToEdit ? "Modifier l'action" : "Nouvelle action prédéfinie"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="action-name">Nom de l'action</Label>
            <Input id="action-name" value={actionName} onChange={(e) => setActionName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveAction}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!actionToDelete} onOpenChange={() => setActionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'action "{actionToDelete?.name}" sera supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAction} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{equipmentToEdit ? "Modifier le type" : "Nouveau type de matériel"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="equipment-name">Nom du type de matériel</Label>
              <Input id="equipment-name" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} />
            </div>
             <div>
              <Label htmlFor="equipment-price">Tarif de prise en charge (€)</Label>
              <Input id="equipment-price" type="number" value={equipmentPrice} onChange={(e) => setEquipmentPrice(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEquipmentDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveEquipment}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!equipmentToDelete} onOpenChange={() => setEquipmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le type "{equipmentToDelete?.name}" sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEquipment} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
