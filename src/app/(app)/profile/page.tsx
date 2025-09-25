
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Mon Profil"
        subtitle="Gérez les informations de votre compte."
      />
      <div className="mt-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalité désactivée</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
                <User className="h-4 w-4" />
                <AlertTitle>Profils non disponibles</AlertTitle>
                <AlertDescription>
                    La gestion des profils et l'authentification des utilisateurs ont été désactivées dans cette version de l'application.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
