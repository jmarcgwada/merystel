
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
  } = usePos();

  return (
    <AlertDialog open={isNavConfirmOpen} onOpenChange={closeNavConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vente en cours</AlertDialogTitle>
          <AlertDialogDescription>
            Une vente est en cours sur une table. Vous devez la sauvegarder ou l'annuler depuis l'interface de vente avant de pouvoir quitter.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={closeNavConfirm}>
                    Rester
                </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
                 <Button variant="destructive" onClick={confirmNavigation}>
                    Quitter (Annuler vente)
                </Button>
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
