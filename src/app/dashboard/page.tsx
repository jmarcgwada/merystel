
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Utensils, Package, BarChart3, FileText, Settings, UserCog, LifeBuoy, TrendingUp, User, Clock, CreditCard, ScanLine, File, FilePlus, DollarSign, Blocks, RefreshCw, Activity } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

export default function DashboardPage() {
    const { user: authUser } = useUser();
    const router = useRouter();
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
    const [isCreditNoteConfirmOpen, setCreditNoteConfirmOpen] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
        setFormattedDate(format(new Date(), "eeee, d MMMM", { locale: fr }));
    }, []);
    
    const todayDateString = format(new Date(), 'yyyy-MM-dd');
    
    const salesModeLink = useMemo(() => {
        const modeMap = {
            pos: { href: '/pos', icon: ShoppingCart, title: 'Mode Caisse', description: 'Accéder au point de vente.' },
            supermarket: { href: '/supermarket', icon: ScanLine, title: 'Mode Supermarché', description: 'Interface rapide pour scanner les articles.' },
            restaurant: { href: '/restaurant', icon: Utensils, title: 'Mode Restaurant', description: 'Gérer les tables et les commandes.' },
        };
        return modeMap[defaultSalesMode];
    }, [defaultSalesMode]);

    const relevantSales = useMemo(() => {
      if (!sales) return [];
      return sales.filter(sale => sale.ticketNumber?.startsWith('Fact-') || sale.ticketNumber?.startsWith('Tick-'))
    }, [sales]);

    
    const todaysSalesData = useMemo(() => {
        if (!relevantSales || !users) return { count: 0, total: 0, lastSale: null, averageBasket: 0 };
        const today = new Date();
        const salesOfToday = relevantSales
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
    }, [relevantSales, users]);

    const outstandingBalance = useMemo(() => {
        if (!sales) return 0;
        // Outstanding balance should only be calculated from invoices
        const invoiceSales = sales.filter(sale => sale.ticketNumber?.startsWith('Fact-'));
        return invoiceSales.reduce((acc, sale) => {
            if (sale.status === 'pending') {
                const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
                const balance = sale.total - totalPaid;
                return acc + balance;
            }
            return acc;
        }, 0);
    }, [sales]);

    const popularItems = useMemo(() => {
        if (!relevantSales || !items) return [];
        const itemCounts: { [key: string]: { item: Item, count: number } } = {};

        relevantSales.forEach(sale => {
            sale.items.forEach(orderItem => {
                if(itemCounts[orderItem.itemId]) {
                    itemCounts[orderItem.itemId].count += orderItem.quantity;
                } else {
                    const itemDetails = items.find(i => i.id === orderItem.itemId);
                    if(itemDetails) {
                         itemCounts[orderItem.itemId] = { item: itemDetails, count: orderItem.quantity };
                    }
                }
            })
        });
        
        return Object.values(itemCounts)
            .sort((a,b) => b.count - a.count)
            .slice(0, 5);

    }, [relevantSales, items]);
    
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
    <>
    <div className="relative isolate min-h-full">
      {isMounted && <div style={backgroundStyle} />}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Tableau de bord"
          subtitle={`Bienvenue, ${authUser?.firstName || 'Utilisateur'}. Voici un aperçu de votre journée.`}
        >
          <div className="flex items-center gap-4">
            {isMounted && todaysSalesData.lastSale && (
                <Card style={buttonStyle} className="bg-accent/10 border-accent/20 hidden xl:block">
                  <CardContent className="p-3">
                      <div className="flex flex-wrap items-center justify-between gap-x-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Dernière vente</Badge>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3" />
                              <span>{format(todaysSalesData.lastSale.date, 'HH:mm')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3" />
                              <span>{todaysSalesData.lastSale.userName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <CreditCard className="h-3 w-3" />
                              <Badge variant="secondary">{todaysSalesData.lastSale.paymentMethod}</Badge>
                            </div>
                            <div className="text-base font-bold text-primary">
                              {todaysSalesData.lastSale.total.toFixed(2)}€
                            </div>
                          </div>
                      </div>
                  </CardContent>
                </Card>
            )}
            <div className="flex items-center gap-1">
              {authUser && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon">
                                <Link href="/settings">
                                    <Settings />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Paramètres</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon">
                                <Link href="/help">
                                    <LifeBuoy />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Assistance et Aide</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </PageHeader>
        
        {isMounted && showDashboardStats && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <Card style={buttonStyle} className="group h-full transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: dashboardButtonTextColor }}>
                        <Link href={`/reports/payments?date=${todayDateString}`} className="text-primary hover:underline">
                            Chiffre d'affaires du jour
                        </Link>
                    </CardTitle>
                    <span className="text-muted-foreground">€</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{todaysSalesData.total.toFixed(2)}€</div>
                    <p className="text-xs text-muted-foreground">
                    {formattedDate ? formattedDate : <Skeleton className="h-4 w-24" />}
                    </p>
                </CardContent>
             </Card>
              <Card style={buttonStyle} className="group h-full transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: dashboardButtonTextColor }}>
                        <Link href={`/reports?date=${todayDateString}`} className="text-primary hover:underline">
                            Ventes Aujourd'hui
                        </Link>
                    </CardTitle>
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
              <Card style={buttonStyle} className="group h-full transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: dashboardButtonTextColor }}>
                        <Link href={`/reports?filterStatus=pending`} className="text-primary hover:underline">
                            Soldes Clients
                        </Link>
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{outstandingBalance.toFixed(2)}€</div>
                    <p className="text-xs text-muted-foreground">
                        Total des paiements en attente
                    </p>
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
                                  <Button asChild variant="secondary" size="sm"><Link href="/commercial/invoices">Factures</Link></Button>
                                  <Button asChild variant="secondary" size="sm"><Link href="/commercial/quotes">Devis</Link></Button>
                                  <Button asChild variant="secondary" size="sm"><Link href="/commercial/delivery-notes">Bons de livraison</Link></Button>
                                  <Button asChild variant="secondary" size="sm"><Link href="/commercial/supplier-orders">Cdes Fournisseur</Link></Button>
                                  <Button variant="secondary" size="sm" onClick={() => setCreditNoteConfirmOpen(true)}>Avoirs</Button>
                          </div>
                      </CardContent>
                  </Card>
                  
                  {salesModeLink && (
                      <Link href={salesModeLink.href} className="group">
                          <Card style={buttonStyle} className={cn("h-full transition-all hover:shadow-md", dashboardButtonShowBorder && "hover:border-primary")}>
                              <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                      <div>
                                          <salesModeLink.icon className="h-8 w-8 text-primary mb-2" />
                                          <h3 className="text-lg font-semibold font-headline" style={{ color: dashboardButtonTextColor }}>{salesModeLink.title}</h3>
                                          <p className="text-sm text-muted-foreground mt-1">{salesModeLink.description}</p>
                                      </div>
                                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                  </div>
                              </CardContent>
                          </Card>
                      </Link>
                  )}

                  <Card style={buttonStyle} className={cn("transition-all hover:shadow-md", dashboardButtonShowBorder && "hover:border-primary")}>
                          <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                  <div>
                                      <Blocks className="h-8 w-8 text-primary mb-2" />
                                      <h3 className="text-lg font-semibold font-headline" style={{ color: dashboardButtonTextColor }}>Gestion</h3>
                                      <p className="text-sm text-muted-foreground mt-1">Gérer articles, clients, etc.</p>
                                  </div>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                  <Button asChild variant="secondary" size="sm"><Link href="/management/items">Articles</Link></Button>
                                  <Button asChild variant="secondary" size="sm"><Link href="/management/categories">Catégories</Link></Button>
                                  <Button asChild variant="secondary" size="sm"><Link href="/management/customers">Clients</Link></Button>
                                  <Button asChild variant="secondary" size="sm"><Link href="/management/tables">Tables</Link></Button>
                              </div>
                          </CardContent>
                      </Card>
                   <Card style={buttonStyle} className={cn("transition-all hover:shadow-md", dashboardButtonShowBorder && "hover:border-primary")}>
                      <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                              <div>
                                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                                  <h3 className="text-lg font-semibold font-headline" style={{ color: dashboardButtonTextColor }}>Rapports</h3>
                                  <p className="text-sm text-muted-foreground mt-1">Analyser les performances.</p>
                              </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                              <Button asChild variant="secondary" size="sm"><Link href="/reports">Pièces de vente</Link></Button>
                              <Button asChild variant="secondary" size="sm"><Link href="/reports/payments">Paiements</Link></Button>
                              <Button asChild variant="secondary" size="sm"><Link href="/reports/popular-items">Articles Populaires</Link></Button>
                              <Button asChild variant="secondary" size="sm"><Link href="/reports/analytics">Reporting avancé</Link></Button>
                          </div>
                      </CardContent>
                  </Card>
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
    <AlertDialog open={isCreditNoteConfirmOpen} onOpenChange={setCreditNoteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Créer un nouvel avoir ?</AlertDialogTitle>
            <AlertDialogDescription>
                Cette action va initialiser une nouvelle pièce de type "Avoir". Êtes-vous sûr de vouloir continuer ?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/commercial/credit-notes')}>
                Confirmer
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
