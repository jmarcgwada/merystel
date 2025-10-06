

'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Utensils, Package, BarChart3, FileText, Settings, UserCog, LifeBuoy, TrendingUp, User, Clock, CreditCard, ScanLine, File, FilePlus } from 'lucide-react';
import { usePos } from '@/contexts/pos-context';
import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Item, Sale } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    return `hsla(var(--card), ${opacity / 100})`;
};

const allQuickLinks = [
    {
        href: '/default-sale', // This will be dynamically replaced
        title: "Mode Caisse",
        description: 'Accéder à l\'interface de vente par défaut.',
        icon: ShoppingCart,
        roles: ['admin', 'manager', 'cashier'],
        id: 'sales-mode',
    },
    {
        href: '/management/items',
        title: 'Gestion',
        description: "Gérer articles, catégories, clients, etc.",
        icon: Package,
        roles: ['admin', 'manager', 'cashier'],
    },
    {
        href: '/settings',
        title: 'Paramètres',
        description: "Configurer l'application.",
        icon: Settings,
        roles: ['admin', 'manager'],
    },
    {
        href: '/help',
        title: "Assistance et Aide",
        description: "Obtenir de l'aide et des conseils.",
        icon: LifeBuoy,
        roles: ['admin', 'manager', 'cashier'],
    },
]

export default function DashboardPage() {
    const { user: authUser } = useUser();
    const { 
        items, 
        sales, 
        isLoading, 
        dashboardBgType, 
        dashboardBackgroundColor, 
        dashboardBackgroundImage, 
        dashboardBgOpacity,
        dashboardButtonBackgroundColor,
        dashboardButtonOpacity,
        dashboardButtonShowBorder,
        dashboardButtonBorderColor,
        dashboardButtonTextColor,
        showDashboardStats,
        users,
        defaultSalesMode,
    } = usePos();

    const [formattedDate, setFormattedDate] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
        setFormattedDate(format(new Date(), "eeee, d MMMM", { locale: fr }));
    }, []);
    
    const quickLinks = useMemo(() => {
        if (!authUser) return [];
        return allQuickLinks
            .map(link => {
                if (link.id === 'sales-mode') {
                    const modeMap = {
                        pos: { href: '/pos', icon: ShoppingCart, description: 'Accéder au point de vente.' },
                        supermarket: { href: '/supermarket', icon: ScanLine, description: 'Interface rapide pour scanner les articles.' },
                        restaurant: { href: '/restaurant', icon: Utensils, description: 'Gérer les tables et les commandes.' },
                    };
                    return { ...link, ...modeMap[defaultSalesMode] };
                }
                return link;
            })
            .filter(link => link.roles.includes(authUser.role));

    }, [authUser, defaultSalesMode]);

    const totalSales = useMemo(() => {
        if (!sales) return 0;
        return sales.reduce((acc, sale) => acc + sale.total, 0);
    }, [sales]);
    
    const todaysSalesData = useMemo(() => {
        if (!sales || !users) return { count: 0, total: 0, lastSale: null, averageBasket: 0 };
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

        const todaysTotal = salesOfToday.reduce((acc, sale) => acc + sale.total, 0);
        const lastSale = salesOfToday.length > 0 ? salesOfToday[0] : null;

        const lastSaleWithUser = lastSale ? {
            ...lastSale,
            userName: users.find(u => u.id === lastSale.userId)?.firstName || 'Inconnu',
            paymentMethod: lastSale.payments?.[0]?.method.name || 'N/A',
        } : null;

        return {
            count: salesOfToday.length,
            total: todaysTotal,
            lastSale: lastSaleWithUser,
            averageBasket: salesOfToday.length > 0 ? todaysTotal / salesOfToday.length : 0,
        };
    }, [sales, users]);

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
        if (!isMounted) return {};
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
    }, [isMounted, dashboardBgType, dashboardBackgroundColor, dashboardBackgroundImage, dashboardBgOpacity]);

    const buttonStyle = useMemo(() => {
        if (!isMounted) return {};
        const style: React.CSSProperties = {
             backgroundColor: hexToRgba(dashboardButtonBackgroundColor, dashboardButtonOpacity),
        };
        if (dashboardButtonShowBorder) {
            style.borderColor = dashboardButtonBorderColor;
            style.borderWidth = '1px';
        } else {
            style.borderColor = 'transparent';
        }
        return style;
    }, [isMounted, dashboardButtonBackgroundColor, dashboardButtonOpacity, dashboardButtonShowBorder, dashboardButtonBorderColor]);


    if (!isMounted || isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                 <PageHeader
                    title="Tableau de bord"
                    subtitle={`Chargement des données...`}
                />
                 <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      {isMounted && <div style={backgroundStyle} />}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Tableau de bord"
          subtitle={`Bienvenue, ${authUser?.firstName || 'Utilisateur'}. Voici un aperçu de votre journée.`}
        />
        
        {isMounted && showDashboardStats && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card style={buttonStyle}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium" style={{ color: dashboardButtonTextColor }}>Chiffre d'affaires du jour</CardTitle>
                      <span className="text-muted-foreground">€</span>
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{todaysSalesData.total.toFixed(2)}€</div>
                       <p className="text-xs text-muted-foreground">
                        {formattedDate ? formattedDate : <Skeleton className="h-4 w-24" />}
                      </p>
                  </CardContent>
              </Card>
              <Card style={buttonStyle}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium" style={{ color: dashboardButtonTextColor }}>Ventes Aujourd'hui</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">+{todaysSalesData.count}</div>
                       <p className="text-xs text-muted-foreground">
                        Nombre total de transactions
                      </p>
                  </CardContent>
              </Card>
              <Card style={buttonStyle}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium" style={{ color: dashboardButtonTextColor }}>Panier moyen du jour</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{todaysSalesData.averageBasket.toFixed(2)}€</div>
                       <p className="text-xs text-muted-foreground">
                        Montant moyen par transaction
                      </p>
                  </CardContent>
              </Card>
            </div>
        )}

        {isMounted && todaysSalesData.lastSale && (
          <div className="mt-6">
            <Card style={buttonStyle} className="bg-accent/10 border-accent/20">
              <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">Dernière vente</Badge>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{format(todaysSalesData.lastSale.date, 'HH:mm')}</span>
                        </div>
                         <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          <span>{todaysSalesData.lastSale.userName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4" />
                          <Badge variant="secondary">{todaysSalesData.lastSale.paymentMethod}</Badge>
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {todaysSalesData.lastSale.total.toFixed(2)}€
                        </div>
                      </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        )}


        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">Accès Rapide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card style={buttonStyle} className={cn("transition-all hover:shadow-md", dashboardButtonShowBorder && "hover:border-primary")}>
                      <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                              <div>
                                  <FileText className="h-8 w-8 text-primary mb-2" />
                                  <h3 className="text-lg font-semibold font-headline" style={{ color: dashboardButtonTextColor }}>Gestion Commerciale</h3>
                                  <p className="text-sm text-muted-foreground mt-1">Gérer les factures, devis, etc.</p>
                              </div>
                          </div>
                           <div className="mt-4 flex flex-wrap gap-2">
                                <Button asChild variant="secondary" size="sm">
                                    <Link href="/commercial/invoices">Factures</Link>
                                </Button>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href="/commercial/quotes">Devis</Link>
                                </Button>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href="/commercial/delivery-notes">Bons de livraison</Link>
                                </Button>
                                <Button variant="secondary" size="sm" disabled>Cdes Client</Button>
                                <Button variant="secondary" size="sm" disabled>Cdes Fournisseur</Button>
                           </div>
                      </CardContent>
                  </Card>
                   <Card style={buttonStyle} className={cn("transition-all hover:shadow-md", dashboardButtonShowBorder && "hover:border-primary")}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <BarChart3 className="h-8 w-8 text-primary mb-2" />
                                    <h3 className="text-lg font-semibold font-headline" style={{ color: dashboardButtonTextColor }}>Rapports</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Analyser les performances et les données.</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button asChild variant="secondary" size="sm">
                                    <Link href="/reports">Pièces de vente</Link>
                                </Button>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href="/reports/payments">Paiements</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                  {quickLinks.map(link => (
                      <Link href={link.href} key={link.href} className="group">
                          <Card style={buttonStyle} className={cn("h-full transition-all hover:shadow-md", dashboardButtonShowBorder && "hover:border-primary")}>
                              <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                      <div>
                                          <link.icon className="h-8 w-8 text-primary mb-2" />
                                          <h3 className="text-lg font-semibold font-headline" style={{ color: dashboardButtonTextColor }}>{link.title}</h3>
                                          <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                                      </div>
                                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                  </div>
                              </CardContent>
                          </Card>
                      </Link>
                  ))}
              </div>
          </div>
          <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">Top Articles du Jour</h2>
              <Card style={buttonStyle}>
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
