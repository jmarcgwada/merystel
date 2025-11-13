
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, ArrowLeft, LayoutDashboard, RefreshCw } from 'lucide-react';
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
import type { RepairActionPreset } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RepairActionPresetsPage() {
  const { repairActionPresets, addRepairActionPreset, updateRepairActionPreset, deleteRepairActionPreset, isLoading } = usePos();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<RepairActionPreset | null>(null);
  const [presetToDelete, setPresetToDelete] = useState<RepairActionPreset | null>(null);
  const [presetName, setPresetName] = useState('');

  const handleOpenDialog = (preset?: RepairActionPreset) => {
    if (preset) {
      setPresetToEdit(preset);
      setPresetName(preset.name);
    } else {
      setPresetToEdit(null);
      setPresetName('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!presetName.trim()) return;

    if (presetToEdit) {
      updateRepairActionPreset({ ...presetToEdit, name: presetName });
    } else {
      addRepairActionPreset({ name: presetName });
    }
    setIsDialogOpen(false);
  };
  
  const handleDelete = () => {
    if(presetToDelete) {
        deleteRepairActionPreset(presetToDelete.id);
        setPresetToDelete(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Actions de Réparation Prédéfinies"
        subtitle="Gérez la liste des actions rapides pour le suivi des réparations."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild size="icon" className="btn-back">
                <Link href="/management/items">
                    <LayoutDashboard />
                </Link>
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une action
            </Button>
        </div>
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Nom de l'action</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading && Array.from({length: 5}).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell colSpan={2}><Skeleton className="h-10 w-full" /></TableCell>
                          </TableRow>
                      ))}
                      {!isLoading && repairActionPresets.map(preset => (
                          <TableRow key={preset.id}>
                              <TableCell className="font-medium">{preset.name}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(preset)}>
                                      <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setPresetToDelete(preset)}>
                                      <Trash2 className="h-4 w-4"/>
                                  </Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{presetToEdit ? "Modifier l'action" : "Nouvelle action"}</DialogTitle>
            <DialogDescription>
              {presetToEdit ? "Modifiez le nom de l'action prédéfinie." : "Saisissez le nom de la nouvelle action prédéfinie."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="preset-name">Nom de l'action</Label>
            <Input id="preset-name" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!presetToDelete} onOpenChange={() => setPresetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'action "{presetToDelete?.name}" sera supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPresetToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

