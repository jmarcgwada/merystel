
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
            Une vente est en cours. Que souhaitez-vous faire ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-start gap-2">
            <Button variant="outline" onClick={closeNavConfirm}>
                Rester
            </Button>
            <Button variant="destructive" onClick={confirmNavigation}>
                Quitter (Annuler vente)
            </Button>
            <Button onClick={holdOrderAndNavigate}>
                Mettre en attente
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
