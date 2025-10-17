'use client';

import { useState, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export default function ImportDataPage() {
  const [dataType, setDataType] = useState('clients');
  const [separator, setSeparator] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [filePreview, setFilePreview] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Show first 100 lines for preview
        const firstLines = text.split('\n').slice(0, 100).join('\n');
        setFilePreview(firstLines);
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <PageHeader
        title="Importation de Données"
        subtitle="Importez vos données depuis un fichier CSV ou texte."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/settings">
            <ArrowLeft />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step 1: Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Étape 1: Sélection</CardTitle>
              <CardDescription>
                Choisissez le type de données et le fichier à importer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="data-type">Type de données</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger id="data-type">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="articles">Articles</SelectItem>
                    <SelectItem value="fournisseurs">Fournisseurs</SelectItem>
                    <SelectItem value="pieces">Pièces de vente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="separator">Séparateur</Label>
                <Input
                  id="separator"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  placeholder="ex: , ou ;"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-header"
                  checked={hasHeader}
                  onCheckedChange={(checked) => setHasHeader(checked as boolean)}
                />
                <label
                  htmlFor="has-header"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  La première ligne est un en-tête
                </label>
              </div>

              <div className="space-y-2">
                 <Label htmlFor="file-upload">Fichier (.csv, .txt)</Label>
                <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>{fileName || 'Choisir un fichier'}</span>
                </Button>
                <input 
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Preview */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Étape 2: Prévisualisation des données brutes</CardTitle>
                    <CardDescription>
                        Voici un aperçu des premières lignes de votre fichier. La prochaine étape sera de faire correspondre ces colonnes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted rounded-md p-4 min-h-[400px] font-mono text-xs">
                        {filePreview ? (
                            <pre className="whitespace-pre-wrap">{filePreview}</pre>
                        ) : (
                            <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                                <p>Aucun fichier sélectionné.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
