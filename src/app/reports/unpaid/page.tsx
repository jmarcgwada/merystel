
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Sale, Customer } from '@/lib/types';
import { usePos } from '@/contexts/pos-context';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
  Edit,
  X,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { ClientFormattedDate } from '@/components/shared/client-formatted-date';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { EditCustomerDialog } from '@/app/management/customers/components/edit-customer-dialog';
import { cn } from '@/lib/utils';
import { sendEmail } from '@/ai/flows/send-email-flow';
import jsPDF from 'jspdf';
import { InvoicePrintTemplate } from '../components/invoice-print-template';


type DunningAction = {
  sale: Sale;
  actionType: 'email' | 'phone' | 'whatsapp';
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';


export default function UnpaidInvoicesPage() {
  const { sales, customers, isLoading, updateSale, smtpConfig, companyInfo, vatRates } = usePos();
  const router = useRouter();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [dunningAction, setDunningAction] = useState<DunningAction | null>(null);
  const [dunningNotes, setDunningNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailToSend, setEmailToSend] = useState('');

  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isSending, setIsSending] = useState(false);

  // State for draggable/resizable modal
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState({ width: 600, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, direction: '' as ResizeDirection });
  const modalRef = useRef<HTMLDivElement>(null);


  const unpaidInvoices = useMemo(() => {
    if (!sales) return [];
    return sales
      .filter((sale) => sale.status === 'pending' && sale.documentType === 'invoice')
      .sort((a, b) => new Date(a.date as any).getTime() - new Date(b.date as any).getTime());
  }, [sales]);
  
  const customerForDunning = useMemo(() => {
    if (!dunningAction || !customers) return null;
    return customers.find(c => c.id === dunningAction.sale.customerId);
  }, [dunningAction, customers]);
  
  const initializeModalState = useCallback(() => {
      const initialWidth = 600;
      const initialHeight = 650;
      setModalSize({ width: initialWidth, height: initialHeight });
      setModalPosition({ 
          x: (window.innerWidth - initialWidth) / 2,
          y: (window.innerHeight - initialHeight) / 2,
      });
  }, []);

  useEffect(() => {
    if (dunningAction) {
        initializeModalState();
    }
  }, [dunningAction, initializeModalState]);

  useEffect(() => {
    if (dunningAction?.actionType === 'email' && customerForDunning) {
        setEmailToSend(customerForDunning.email || '');
    }
  }, [dunningAction, customerForDunning]);
  
  useEffect(() => {
    if (dunningAction && dunningAction.actionType === 'email') {
        const sale = dunningAction.sale;
        const totalDue = sale.total - (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);

        setEmailToSend(customerForDunning?.email || '');
        setEmailSubject(`Rappel pour votre facture impayée #${sale.ticketNumber}`);
        setEmailBody(
`Bonjour ${customerForDunning?.name || 'client(e)'},

Sauf erreur de notre part, il semble que votre facture n°${sale.ticketNumber} d'un montant de ${totalDue.toFixed(2)}€, datée du ${new Date(sale.date as any).toLocaleDateString('fr-FR')}, soit toujours en attente de règlement.

Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les plus brefs délais.

Nous restons à votre disposition pour toute question.

Cordialement,
L'équipe de ${companyInfo?.name || 'votre entreprise'}`
        );
    }
  }, [dunningAction, customerForDunning, companyInfo]);

  const getCustomerName = useCallback(
    (customerId?: string) => {
      if (!customerId || !customers) return 'N/A';
      return customers.find((c) => c.id === customerId)?.name || 'Client supprimé';
    },
    [customers]
  );
  
  const handleDunningAction = async () => {
    if (!dunningAction) return;

    if (dunningAction.actionType === 'email') {
      if (!smtpConfig?.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.password || !smtpConfig.senderEmail) {
        toast({ variant: 'destructive', title: 'Configuration SMTP requise', description: 'Veuillez configurer les paramètres SMTP dans la page "Connectivité" avant d\'envoyer des e-mails.' });
        return;
      }
       if (!emailToSend) {
        toast({ variant: 'destructive', title: 'Email manquant', description: 'Veuillez renseigner l\'adresse e-mail du client.' });
        return;
      }
      
      setIsSending(true);
      toast({ title: 'Envoi en cours...' });
      
      const emailResult = await sendEmail({
          smtpConfig: {
              host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure || false,
              auth: { user: smtpConfig.user, pass: smtpConfig.password },
              senderEmail: smtpConfig.senderEmail,
          },
          to: emailToSend,
          subject: emailSubject,
          text: emailBody,
          html: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
          // attachments: pdfData ? [{ filename: pdfData.filename, content: pdfData.content, encoding: 'base64' }] : undefined,
      });

      toast({
          variant: emailResult.success ? 'default' : 'destructive',
          title: emailResult.success ? 'E-mail envoyé !' : "Échec de l'envoi",
          description: emailResult.message,
      });
      setIsSending(false);

    }
    
    const updatedSale: Sale = {
      ...dunningAction.sale,
      dunningLevel: (dunningAction.sale.dunningLevel || 0) + 1,
      lastDunningDate: new Date(),
    };
    
    await updateSale(updatedSale);

    // addDunningLog({ saleId, actionType, notes, status });
    if(dunningAction.actionType !== 'email') {
        toast({
          title: 'Relance enregistrée',
          description: `Une relance de type "${dunningAction.actionType}" a été enregistrée pour la facture #${dunningAction.sale.ticketNumber}.`,
        });
    }

    setDunningAction(null);
    setDunningNotes('');
  };


  const totalAmountDue = useMemo(() => {
    return unpaidInvoices.reduce((acc, sale) => {
        const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
        return acc + (sale.total - totalPaid);
    }, 0);
  }, [unpaidInvoices]);
  
  const openEditCustomerModal = () => {
    if (customerForDunning) {
      setCustomerToEdit(customerForDunning);
      setIsEditCustomerOpen(true);
    }
  };

  // Drag and Resize handlers
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current) {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - modalPosition.x,
            y: e.clientY - modalPosition.y,
        });
    }
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: modalSize.width,
      height: modalSize.height,
      direction: direction,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
        setModalPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    } else if(isResizing) {
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = modalPosition.x;
      let newY = modalPosition.y;

      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      
      if (resizeStart.direction.includes('e')) newWidth = resizeStart.width + dx;
      if (resizeStart.direction.includes('w')) {
          newWidth = resizeStart.width - dx;
          newX = modalPosition.x + dx;
      }
      if (resizeStart.direction.includes('s')) newHeight = resizeStart.height + dy;
      if (resizeStart.direction.includes('n')) {
          newHeight = resizeStart.height - dy;
          newY = modalPosition.y + dy;
      }

      if (newWidth < 400) newWidth = 400;
      if (newHeight < 300) newHeight = 300;

      setModalSize({ width: newWidth, height: newHeight });
       if (resizeStart.direction.includes('w') || resizeStart.direction.includes('n')) {
            setModalPosition({ x: newX, y: newY });
        }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, modalPosition.x, modalPosition.y]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  const resizeHandles: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  const getResizeHandleClass = (dir: ResizeDirection) => {
    switch (dir) {
      case 'n': return 'cursor-n-resize top-0 h-2 inset-x-2';
      case 's': return 'cursor-s-resize bottom-0 h-2 inset-x-2';
      case 'e': return 'cursor-e-resize right-0 w-2 inset-y-2';
      case 'w': return 'cursor-w-resize left-0 w-2 inset-y-2';
      case 'ne': return 'cursor-ne-resize top-0 right-0 h-3 w-3';
      case 'nw': return 'cursor-nw-resize top-0 left-0 h-3 w-3';
      case 'se': return 'cursor-se-resize bottom-0 right-0 h-3 w-3';
      case 'sw': return 'cursor-sw-resize bottom-0 left-0 h-3 w-3';
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Factures Impayées"
          subtitle={`Suivi de ${unpaidInvoices.length} factures en attente de paiement.`}
        >
          <div className="flex items-center gap-2">
              <Card className="p-2 text-center">
                  <p className="text-xs text-muted-foreground">Montant total dû</p>
                  <p className="text-lg font-bold text-destructive">{totalAmountDue.toFixed(2)}€</p>
              </Card>
            <Button asChild variant="outline" className="btn-back">
              <Link href="/dashboard">
                <ArrowLeft />
                Retour
              </Link>
            </Button>
          </div>
        </PageHeader>
        <div className="mt-8">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date d'échéance</TableHead>
                    <TableHead>Montant Dû</TableHead>
                    <TableHead>Niveau de Relance</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6} className="h-12" /></TableRow>
                  ))}
                  {!isLoading && unpaidInvoices.map((sale) => {
                      const totalPaid = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
                      const amountDue = sale.total - totalPaid;
                      return (
                          <TableRow key={sale.id}>
                              <TableCell>
                                  <Link href={`/reports/${sale.id}?from=unpaid`} className="font-medium text-primary hover:underline">
                                      {sale.ticketNumber}
                                  </Link>
                              </TableCell>
                              <TableCell>{getCustomerName(sale.customerId)}</TableCell>
                              <TableCell>
                                  <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" />
                              </TableCell>
                              <TableCell className="font-semibold text-destructive">
                                  {amountDue.toFixed(2)}€
                              </TableCell>
                              <TableCell>
                                  <Badge variant={sale.dunningLevel ? "default" : "outline"}>
                                      Niveau {sale.dunningLevel || 0}
                                  </Badge>
                                  {sale.lastDunningDate && <p className="text-xs text-muted-foreground"><ClientFormattedDate date={sale.lastDunningDate} formatString="d MMM yy" /></p>}
                              </TableCell>
                              <TableCell className="text-right">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                              <MoreVertical className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                          <DropdownMenuItem onClick={() => setDunningAction({ sale, actionType: 'email' })}>
                                              <Mail className="mr-2 h-4 w-4" />
                                              Relance par Email
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setDunningAction({ sale, actionType: 'phone' })}>
                                              <Phone className="mr-2 h-4 w-4" />
                                              Enregistrer un Appel
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setDunningAction({ sale, actionType: 'whatsapp' })}>
                                              <MessageSquare className="mr-2 h-4 w-4" />
                                              Envoyer un WhatsApp
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      )
                  })}
                </TableBody>
              </Table>
              {!isLoading && unpaidInvoices.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                      <p>Aucune facture impayée pour le moment.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {dunningAction && (
        <div className="fixed inset-0 z-50 bg-black/80">
            <div
              ref={modalRef}
              style={{
                  width: `${modalSize.width}px`,
                  height: `${modalSize.height}px`,
                  top: `${modalPosition.y}px`,
                  left: `${modalPosition.x}px`,
                  position: 'fixed',
              }}
              className="z-50 flex flex-col rounded-lg border bg-background shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                  data-drag-handle
                  onMouseDown={handleDragStart}
                  className={cn(
                      "flex items-center justify-between p-4 bg-muted/50 border-b cursor-grab",
                      isDragging && "cursor-grabbing"
                  )}
              >
                  <h2 className="font-semibold leading-none tracking-tight">
                    Enregistrer une action de relance - {dunningAction.sale.ticketNumber}
                  </h2>
                  <button onClick={() => setDunningAction(null)} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fermer</span>
                  </button>
              </div>
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                   {dunningAction?.actionType === 'email' ? (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="space-y-2">
                                <Label htmlFor="email-to">Destinataire</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                      id="email-to" 
                                      value={emailToSend} 
                                      onChange={(e) => setEmailToSend(e.target.value)}
                                      placeholder={customerForDunning ? "Email manquant" : "Aucun client associé"}
                                    />
                                    {customerForDunning && (
                                      <Button variant="outline" size="sm" onClick={openEditCustomerModal}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                      </Button>
                                    )}
                               </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email-subject">Sujet</Label>
                                <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                            </div>
                            <div className="space-y-2 flex-1 flex flex-col">
                                <Label htmlFor="email-body">Message</Label>
                                <Textarea
                                    id="email-body"
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    rows={8}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Label htmlFor="dunning-notes">Notes (optionnel)</Label>
                            <Textarea
                                id="dunning-notes"
                                placeholder="Ex: Laissé un message vocal, email envoyé sans réponse..."
                                value={dunningNotes}
                                onChange={(e) => setDunningNotes(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                    )}
              </div>
              <div className="flex justify-end gap-2 p-4 border-t bg-muted/50">
                <Button variant="ghost" onClick={() => { setDunningAction(null); setDunningNotes(''); }}>Annuler</Button>
                <Button onClick={handleDunningAction} disabled={isSending}>
                  {dunningAction?.actionType === 'email' ? (
                    <> <Send className="mr-2 h-4 w-4" /> {isSending ? 'Envoi...' : 'Envoyer la relance'} </>
                  ) : 'Enregistrer l\'action'}
                </Button>
              </div>
              {resizeHandles.map(dir => (
                <div
                    key={dir}
                    data-resize-handle
                    onMouseDown={(e) => handleResizeStart(e, dir)}
                    className={cn('absolute z-10', getResizeHandleClass(dir))}
                />
              ))}
            </div>
        </div>
      )}
      
      <EditCustomerDialog 
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        customer={customerToEdit}
      />
    </>
  );
}
