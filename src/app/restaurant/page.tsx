
'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { TableLayout } from './components/table-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';

// Function to convert hex to rgba
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
    return `hsla(var(--background), ${opacity / 100})`;
};

export default function RestaurantPage() {
  const { restaurantModeBackgroundColor, restaurantModeBgOpacity } = usePos();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const backgroundColor = isClient ? hexToRgba(restaurantModeBackgroundColor, restaurantModeBgOpacity) : 'transparent';

  return (
    <div style={{ backgroundColor }} className="h-full">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Mode Restaurant"
          subtitle="Sélectionnez une table pour voir ou commencer une commande."
        >
          <Button asChild className="btn-back">
            <Link href="/dashboard">
              <ArrowLeft />
              Tableau de bord
            </Link>
          </Button>
        </PageHeader>
        <div className="mt-8">
          <TableLayout />
        </div>
      </div>
    </div>
  );
}
