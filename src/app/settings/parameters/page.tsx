
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ParametersPage() {
  return (
    <>
      <PageHeader
        title="Paramétrage"
        subtitle="Configurez les paramètres fonctionnels de l'application."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/settings">
            <ArrowLeft />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Options générales</CardTitle>
          <CardDescription>
            Cette section contiendra les futurs paramètres de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucun paramètre disponible pour le moment.</p>
        </CardContent>
      </Card>
    </>
  );
}
