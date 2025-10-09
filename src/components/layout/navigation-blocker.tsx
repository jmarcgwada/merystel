'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePos } from '@/contexts/pos-context';

/**
 * Ce composant bloque la navigation "retour" du navigateur
 * uniquement si une condition est remplie (ex: une commande est en cours).
 */
export function NavigationBlocker() {
  const pathname = usePathname();
  const { order, showNavConfirm } = usePos();

  useEffect(() => {
    // Cette logique ne s'active que s'il y a une commande en cours.
    if (order.length === 0) {
      return; // Ne rien faire si le panier est vide.
    }

    // Ajoute une entrée "factice" dans l'historique pour pouvoir intercepter le "retour".
    // L'URL reste la même, mais l'historique a une nouvelle entrée.
    history.pushState(null, '', pathname);

    const handlePopState = (event: PopStateEvent) => {
      // Si une commande est toujours en cours lors de la tentative de retour...
      if (order.length > 0) {
        // 1. Annuler la navigation "retour" en "repartant en avant".
        history.go(1);
        
        // 2. Ouvrir la boîte de dialogue pour demander confirmation à l'utilisateur.
        // L'URL de destination est inconnue, donc on passe l'URL actuelle
        // pour que `confirmNavigation` sache où aller si l'utilisateur confirme.
        showNavConfirm(pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Nettoyage : retirer l'écouteur quand le composant est détruit ou que les dépendances changent.
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, order.length, showNavConfirm]); // L'effet dépend du chemin et de la présence d'une commande.

  // Ce composant n'affiche rien à l'écran.
  return null;
}
