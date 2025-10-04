
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePos } from '@/contexts/pos-context';
import { Skeleton } from '@/components/ui/skeleton';

function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-primary animate-pulse"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
        <p className="text-muted-foreground">Vérification de la session...</p>
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const { validateSession, forceSignOut, sessionInvalidated, setSessionInvalidated, order } = usePos();
  const [isCheckingSession, setIsCheckingSession] = useState(true);


  useEffect(() => {
    if (loading) {
      return; // Attendre la fin du chargement initial de l'état d'authentification
    }

    if (!user) {
      redirect('/login');
      return;
    }

    // À partir d'ici, nous savons que l'utilisateur est authentifié via Firebase.
    // Maintenant, nous vérifions notre logique de session personnalisée.
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken || !validateSession(user.uid, sessionToken)) {
        if (order && order.length > 0) {
            // S'il y a une commande en cours, ne pas déconnecter immédiatement.
            // Marquer la session comme invalide et laisser l'utilisateur terminer.
            setSessionInvalidated(true);
        } else {
            // Pas de commande en cours, forcer la déconnexion.
            forceSignOut("Une nouvelle session a été démarrée sur un autre appareil.");
            return; // Stopper l'exécution pour éviter d'afficher le contenu.
        }
    } else if (sessionInvalidated && order && order.length === 0) {
        // Si la session était invalide et que la commande est maintenant terminée, forcer la déconnexion.
        forceSignOut("Session terminée après la fin de la transaction.");
        return;
    }

    setIsCheckingSession(false);

  }, [user, loading, validateSession, forceSignOut, order, sessionInvalidated, setSessionInvalidated]);

  // Affiche un écran de chargement tant que la session n'est pas validée, ou que Firebase charge.
  if (isCheckingSession || loading) {
    return <AppLoading />;
  }

  // Si l'utilisateur est déconnecté (ce qui peut arriver entre les rendus), ne rien afficher en attendant la redirection.
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
