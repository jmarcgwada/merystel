
'use client';

import { usePos } from '@/contexts/pos-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '../ui/button';

export function NavigationConfirmationDialog() {
  const {
    isNavConfirmOpen,
    closeNavConfirm,
    confirmNavigation,
    selectedTable,
  } = usePos();

  const title = selectedTable ? `Vente en cours sur la table "${selectedTable.name}"` : 'Vente en cours';
  const description = selectedTable 
    ? "La commande de cette table sera perdue si vous quittez sans sauvegarder."
    : "La commande actuelle sera perdue si vous quittez sans la mettre en attente ou la payer.";


  return (
    <AlertDialog open={isNavConfirmOpen} onOpenChange={closeNavConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description} Voulez-vous vraiment quitter ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={closeNavConfirm}>
                    Rester sur la page
                </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
                 <Button variant="destructive" onClick={async () => await confirmNavigation()}>
                    Quitter & Annuler la vente
                </Button>
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
