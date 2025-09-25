
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
    holdOrderAndNavigate,
  } = usePos();

  return (
    <AlertDialog open={isNavConfirmOpen} onOpenChange={closeNavConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vente en cours</AlertDialogTitle>
          <AlertDialogDescription>
            Vous avez des articles dans votre commande. Que souhaitez-vous faire avant de quitter cette page ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-start gap-2">
            <Button variant="outline" onClick={closeNavConfirm}>
                Rester sur la page
            </Button>
            <Button variant="destructive" onClick={confirmNavigation}>
                Annuler la vente et quitter
            </Button>
            <Button onClick={holdOrderAndNavigate}>
                Mettre en attente et quitter
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
