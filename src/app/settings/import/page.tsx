
'use client';

import { useState, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ImportDataPage() {
  const [dataType, setDataType] = useState('clients');
  const [separator, setSeparator] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  const parsedData = useMemo(() => {
    if (!fileContent) return [];
    const lines = fileContent.trim().split('\n');
    return lines.map(line => line.split(separator));
  }, [fileContent, separator]);

  const headerRow = hasHeader && parsedData.length > 0 ? parsedData[0] : [];
  const dataRows = hasHeader ? parsedData.slice(1) : parsedData;

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
              <CardTitle>Étape 1: Sélection & Format</CardTitle>
              <CardDescription>
                Choisissez le type de données et le format du fichier à importer.
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
                    <CardTitle>Étape 2: Prévisualisation des données</CardTitle>
                    <CardDescription>
                        Vérifiez que vos données sont correctement séparées en colonnes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] border rounded-md">
                      <Table className="bg-muted">
                        {hasHeader && headerRow.length > 0 && (
                          <TableHeader>
                            <TableRow>
                              {headerRow.map((header, index) => (
                                <TableHead key={index}>{header}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                        )}
                        <TableBody>
                          {dataRows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="text-xs">{cell}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {parsedData.length === 0 && (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                          <p>Aucun fichier sélectionné.</p>
                        </div>
                      )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
