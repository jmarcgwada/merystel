
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${opacity / 100})`;
    }
    return `hsla(var(--background), ${opacity/100})`;
};

const ColorSetting = ({ title, color, setColor, opacity, setOpacity }: { title: string, color: string, setColor: (color: string) => void, opacity: number, setOpacity: (opacity: number) => void }) => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    
    const previewStyle = isClient ? { backgroundColor: hexToRgba(color, opacity) } : {};

    return (
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="p-4 rounded-lg border space-y-4">
                <h3 className="font-semibold">{title}</h3>
                <div className="grid gap-2">
                    <Label htmlFor={`${title}-color`}>Couleur de fond</Label>
                    <div className="flex items-center gap-4">
                        <Input
                            id={`${title}-color`}
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-16 h-12 p-1"
                        />
                        {isClient ? <span className="font-mono text-sm text-muted-foreground">{color}</span> : <Skeleton className="h-5 w-20" />}
                    </div>
                </div>
                <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor={`${title}-opacity`}>Opacité</Label>
                        {isClient ? <span className="text-sm font-bold text-primary">{opacity}%</span> : <Skeleton className="h-5 w-10" />}
                    </div>
                    {isClient ? (
                        <Slider 
                            id={`${title}-opacity`}
                            value={[opacity]} 
                            onValueChange={(value) => setOpacity(value[0])}
                            min={0} max={100} step={5} 
                        />
                    ) : <Skeleton className="h-5 w-full" />}
                </div>
            </div>
            <div 
                className="p-4 rounded-lg border bg-card flex items-center justify-center h-40"
                style={previewStyle}
            >
                <p className="font-semibold text-muted-foreground">Aperçu {title}</p>
            </div>
        </div>
    );
};

export default function DocumentColorsPage() {
  const { 
    invoiceBgColor, setInvoiceBgColor, invoiceBgOpacity, setInvoiceBgOpacity,
    quoteBgColor, setQuoteBgColor, quoteBgOpacity, setQuoteBgOpacity,
    deliveryNoteBgColor, setDeliveryNoteBgColor, deliveryNoteBgOpacity, setDeliveryNoteBgOpacity,
    supplierOrderBgColor, setSupplierOrderBgColor, supplierOrderBgOpacity, setSupplierOrderBgOpacity,
    creditNoteBgColor, setCreditNoteBgColor, creditNoteBgOpacity, setCreditNoteBgOpacity,
  } = usePos();

  return (
    <>
      <PageHeader
        title="Couleurs des Documents"
        subtitle="Personnalisez la couleur de fond pour chaque type de document commercial."
      >
        <Button asChild variant="outline" className="btn-back">
          <Link href="/settings">
            <ArrowLeft />
            Retour aux paramètres
          </Link>
        </Button>
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Couleurs de fond</CardTitle>
            <CardDescription>
              Choisissez une couleur et une opacité pour l'arrière-plan de chaque page de document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <ColorSetting 
                title="Factures"
                color={invoiceBgColor}
                setColor={setInvoiceBgColor}
                opacity={invoiceBgOpacity}
                setOpacity={setInvoiceBgOpacity}
            />
            <ColorSetting 
                title="Devis"
                color={quoteBgColor}
                setColor={setQuoteBgColor}
                opacity={quoteBgOpacity}
                setOpacity={setQuoteBgOpacity}
            />
             <ColorSetting 
                title="Bons de livraison"
                color={deliveryNoteBgColor}
                setColor={setDeliveryNoteBgColor}
                opacity={deliveryNoteBgOpacity}
                setOpacity={setDeliveryNoteBgOpacity}
            />
            <ColorSetting 
                title="Commandes Fournisseur"
                color={supplierOrderBgColor}
                setColor={setSupplierOrderBgColor}
                opacity={supplierOrderBgOpacity}
                setOpacity={setSupplierOrderBgOpacity}
            />
             <ColorSetting 
                title="Avoirs"
                color={creditNoteBgColor}
                setColor={setCreditNoteBgColor}
                opacity={creditNoteBgOpacity}
                setOpacity={setCreditNoteBgOpacity}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
