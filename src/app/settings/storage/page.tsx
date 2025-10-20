
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface StorageInfo {
  key: string;
  size: number; // in bytes
}

const LOCAL_STORAGE_QUOTA = 5 * 1024 * 1024; // 5 MB in bytes

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function StoragePage() {
  const [storageData, setStorageData] = useState<StorageInfo[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  const calculateStorage = () => {
    let total = 0;
    const data: StorageInfo[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          total += size;
          data.push({ key, size });
        }
      }
    }
    setTotalSize(total);
    setStorageData(data.sort((a, b) => b.size - a.size));
  };

  useEffect(() => {
    calculateStorage();
  }, []);

  const usagePercentage = (totalSize / LOCAL_STORAGE_QUOTA) * 100;

  return (
    <>
      <PageHeader
        title="Gestion du Stockage Local"
        subtitle="Analysez l'espace de stockage utilisé par l'application dans votre navigateur."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={calculateStorage}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline" className="btn-back">
            <Link href="/settings">
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="mt-8 grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Utilisation Globale</CardTitle>
            <CardDescription>
              Espace total utilisé sur la limite estimée de 5 Mo de votre navigateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={usagePercentage} />
              <div className="flex justify-between text-sm font-medium">
                <span>{formatBytes(totalSize)} / {formatBytes(LOCAL_STORAGE_QUOTA)}</span>
                <span className="text-primary">{usagePercentage.toFixed(2)}%</span>
              </div>
            </div>
            {usagePercentage > 90 && (
                 <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Attention</AlertTitle>
                    <p>L'espace de stockage est presque plein. Pensez à supprimer des données via la page "Données Firestore" pour éviter des problèmes de performance.</p>
                </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détail par Fichier</CardTitle>
            <CardDescription>
              Taille de chaque ensemble de données stocké localement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du fichier de données</TableHead>
                  <TableHead className="text-right">Taille</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageData.map(({ key, size }) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatBytes(size)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
