
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserCog } from 'lucide-react';

export default function UsersPage() {
  return (
    <>
      <PageHeader title="Gérer les utilisateurs" subtitle="Modifier les rôles et les permissions des utilisateurs." />
       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Fonctionnalité désactivée</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
             <Alert variant="destructive">
                <UserCog className="h-4 w-4" />
                <AlertTitle>Gestion des utilisateurs non disponible</AlertTitle>
                <AlertDescription>
                    La gestion des utilisateurs et l'authentification ont été désactivées dans cette version de l'application.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </>
  );
}
