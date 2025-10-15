
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ModesPage() {
  const { isForcedMode, setIsForcedMode } = usePos();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <PageHeader
        title="Modes Forcés"
        subtitle="Verrouillez l'application dans un mode spécifique pour certains utilisateurs."
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
          <CardTitle>Configuration du mode</CardTitle>
          <CardDescription>
            Activez un mode pour verrouiller l'application. Une combinaison de touches spéciale ou un code PIN sera requis pour déverrouiller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="forced-mode" className="text-base">Activer le mode forcé</Label>
              <p className="text-sm text-muted-foreground">
                Verrouille l'application sur le mode de vente par défaut défini dans les paramètres.
              </p>
            </div>
            {isClient ? (
              <Switch 
                id="forced-mode" 
                checked={isForcedMode}
                onCheckedChange={setIsForcedMode}
              />
            ) : <Skeleton className="h-6 w-11" />}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
