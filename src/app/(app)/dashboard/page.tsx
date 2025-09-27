

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Utensils, Package, BarChart3, FileText, Settings, UserCog } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Item } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';

const quickLinks = [
    {
        href: '/pos',
        title: "Point de Vente",
        description: 'Accéder à l\'interface de vente principale.',
        icon: ShoppingCart
    },
    {
        href: '/restaurant',
        title: "Mode Restaurant",
        description: "Gérer les tables et les commandes.",
        icon: Utensils
    },
    {
        href: '/commercial',
        title: "Commercial",
        description: "Créer des commandes et des factures.",
        icon: FileText
    },
    {
        href: '/management/items',
        title: 'Gestion',
        description: "Gérer articles, catégories, clients, etc.",
        icon: Package
    },
    {
        href: '/reports',
        title: 'Rapports de Vente',
        description: "Analyser les performances de vente.",
        icon: BarChart3
    },
]

export default function DashboardPage() {
    const { user: authUser } = useUser();
    const { 
        sales, 
        items, 
        isLoading, 
        dashboardBgType, 
        dashboardBackgroundColor, 
        dashboardBackgroundImage, 
        dashboardBgOpacity 
    } = usePos();
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        setFormattedDate(format(new Date(), "eeee, d MMMM", { locale: fr }));
    }, []);

    const totalSales = useMemo(() => {
        if (!sales) return 0;
        return sales.reduce((acc, sale) => acc + sale.total, 0);
    }, [sales]);
    
    const todaysSalesData = useMemo(() => {
        if (!sales) return { count: 0, lastSaleDate: null };
        const today = new Date();
        const salesOfToday = sales
            .map(sale => ({
                ...sale,
                date: (sale.date as unknown as Timestamp)?.toDate ? (sale.date as unknown as Timestamp).toDate() : new Date(sale.date)
            }))
            .filter(sale => {
                if (isNaN(sale.date.getTime())) return false; // Invalid date
                return format(sale.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort descending by date

        return {
            count: salesOfToday.length,
            lastSaleDate: salesOfToday.length > 0 ? salesOfToday[0].date : null
        };
    }, [sales]);

    const popularItems = useMemo(() => {
        if (!sales || !items) return [];
        const itemCounts: { [key: string]: { item: Item, count: number } } = {};

        sales.forEach(sale => {
            sale.items.forEach(orderItem => {
                if(itemCounts[orderItem.id]) {
                    itemCounts[orderItem.id].count += orderItem.quantity;
                } else {
                    const itemDetails = items.find(i => i.id === orderItem.id);
                    if(itemDetails) {
                         itemCounts[orderItem.id] = { item: itemDetails, count: orderItem.quantity };
                    }
                }
            })
        });
        
        return Object.values(itemCounts)
            .sort((a,b) => b.count - a.count)
            .slice(0, 5);

    }, [sales, items]);
    
    const backgroundStyle = useMemo(() => {
        const style: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            opacity: dashboardBgOpacity / 100,
        };
        if (dashboardBgType === 'image') {
            style.backgroundImage = `url(${dashboardBackgroundImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
        } else {
            style.backgroundColor = dashboardBackgroundColor;
        }
        return style;
    }, [dashboardBgType, dashboardBackgroundColor, dashboardBackgroundImage, dashboardBgOpacity]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                 <PageHeader
                    title="Tableau de bord"
                    subtitle={`Chargement des données...`}
                />
                 <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                 </div>
                 <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-96" />
                    </div>
                     <div className="lg:col-span-1">
                        <Skeleton className="h-96" />
                     </div>
                 </div>
            </div>
        )
    }


  return (
    <div className="relative isolate min-h-full">
      <div style={backgroundStyle} />
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Tableau de bord"
          subtitle={`Bienvenue, ${authUser?.firstName || 'Utilisateur'}. Voici un aperçu de votre journée.`}
        />
        
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires total</CardTitle>
                  <span className="text-muted-foreground">€</span>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totalSales.toFixed(2)}€</div>
                  <p className="text-xs text-muted-foreground">Basé sur toutes les ventes enregistrées</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventes Aujourd'hui</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">+{todaysSalesData.count}</div>
                  <div className="text-xs text-muted-foreground">
                      {formattedDate ? formattedDate : <Skeleton className="h-4 w-24" />}
                      {todaysSalesData.lastSaleDate && ` - Dernière à ${format(todaysSalesData.lastSaleDate, 'HH:mm')}`}
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
                  <span className="text-muted-foreground">€</span>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{sales && sales.length > 0 ? (totalSales / sales.length).toFixed(2) : '0.00'}€</div>
                  <p className="text-xs text-muted-foreground">Sur {sales?.length || 0} transactions</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="text-sm font-medium">Articles Populaires</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {popularItems.slice(0, 3).map(({ item, count }) => (
                          <div key={item.id} className="flex items-center justify-between">
                              <div>
                                  <p className="font-semibold text-sm">{item.name}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-primary text-sm">{count} ventes</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">Accès Rapide</h2>
              <div className="grid gap-6 md:grid-cols-2">
                  {quickLinks.map(link => (
                      <Link href={link.href} key={link.href} className="group">
                          <Card className="h-full transition-all hover:shadow-md hover:border-primary">
                              <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                      <div>
                                          <link.icon className="h-8 w-8 text-primary mb-2" />
                                          <h3 className="text-lg font-semibold font-headline">{link.title}</h3>
                                          <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                                      </div>
                                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                  </div>
                              </CardContent>
                          </Card>
                      </Link>
                  ))}
                  {authUser?.role !== 'cashier' && (
                      <Link href="/settings" className="group">
                          <Card className="h-full transition-all hover:shadow-md hover:border-primary">
                              <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                      <div>
                                          <Settings className="h-8 w-8 text-primary mb-2" />
                                          <h3 className="text-lg font-semibold font-headline">Paramètres</h3>
                                          <p className="text-sm text-muted-foreground mt-1">Configurer l'application.</p>
                                      </div>
                                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                  </div>
                              </CardContent>
                          </Card>
                      </Link>
                  )}
              </div>
          </div>
          <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">Top Articles</h2>
              <Card>
                  <CardContent className="pt-6">
                      <div className="space-y-4">
                          {popularItems.map(({ item, count }, index) => (
                              <div key={item.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                                      <div>
                                          <p className="font-semibold">{item.name}</p>
                                          <p className="text-sm text-muted-foreground">{item.price.toFixed(2)}€</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-primary">{count}</p>
                                      <p className="text-xs text-muted-foreground">Ventes</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  );
}