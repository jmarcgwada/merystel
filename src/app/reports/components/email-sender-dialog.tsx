
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePos } from '@/contexts/pos-context';
import type { Sale, Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/ai/flows/send-email-flow';
import jsPDF from 'jspdf';
import { InvoicePrintTemplate } from './invoice-print-template';
import { Edit, Send, File, Upload, Trash2, FilePlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Attachment {
  filename: string;
  content: string; // Base64 encoded content
  encoding: 'base64';
}

interface EmailSenderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
  customer?: Customer | null;
  dunningMode?: boolean;
  onSend?: (notes?: string) => void;
}

export function EmailSenderDialog({
  isOpen,
  onClose,
  sale,
  initialCustomer,
  dunningMode,
  onSend,
}: EmailSenderDialogProps) {
  const { customers, companyInfo, smtpConfig, vatRates } = usePos();
  const { toast } = useToast();
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailToSend, setEmailToSend] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const customer = useMemo(() => {
    if (initialCustomer) return initialCustomer;
    if (!sale || !customers) return null;
    return customers.find(c => c.id === sale.customerId);
  }, [sale, customers, initialCustomer]);

  const pieceType = sale?.documentType === 'invoice' ? 'facture'
                  : sale?.documentType === 'quote' ? 'devis'
                  : sale?.documentType === 'delivery_note' ? 'bon de livraison'
                  : sale?.documentType === 'credit_note' ? 'avoir'
                  : 'document';
  
  const generatePdfForEmail = useCallback(async (saleForPdf: Sale): Promise<Attachment | null> => {
    if (!printRef.current || !saleForPdf) {
      toast({ variant: 'destructive', title: "Erreur de génération PDF" });
      return null;
    }
    const pdf = new jsPDF('p', 'mm', 'a4');
    await pdf.html(printRef.current, {
      autoPaging: 'text',
      width: 210,
      windowWidth: printRef.current.scrollWidth,
    });
    const pdfDataString = pdf.output('datauristring');
    const pdfType = saleForPdf.documentType === 'invoice' ? 'facture'
                    : saleForPdf.documentType === 'quote' ? 'devis'
                    : saleForPdf.documentType === 'delivery_note' ? 'bon_de_livraison'
                    : saleForPdf.documentType === 'credit_note' ? 'avoir'
                    : 'document';
    const filename = `${pdfType}-${saleForPdf.ticketNumber || 'document'}.pdf`.replace(/ /g, '_');
    return {
      content: pdfDataString.split(',')[1],
      filename: filename,
      encoding: 'base64',
    };
  }, [toast]);
  

  useEffect(() => {
    if (isOpen && sale) {
        setIsGeneratingPdf(true);
        generatePdfForEmail(sale).then(pdfAttachment => {
            if(pdfAttachment) {
                setAttachments([pdfAttachment]);
            }
            setIsGeneratingPdf(false);
        });
    } else if (!isOpen) {
      setAttachments([]);
    }
  }, [isOpen, sale, generatePdfForEmail]);

  useEffect(() => {
    if (!customer) return;

    setEmailToSend(customer.email || '');
    const companySignature = `\n\nCordialement,\nL'équipe de ${companyInfo?.name || 'votre entreprise'}\n${companyInfo?.address || ''}\n${companyInfo?.postalCode || ''} ${companyInfo?.city || ''}\n${companyInfo?.phone || ''}\n${companyInfo?.email || ''}`;
    
    if (sale) {
        const totalDue = sale.total - (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);

        if (dunningMode) {
            setEmailSubject(`Rappel pour votre facture impayée #${sale.ticketNumber}`);
            setEmailBody(
            `Bonjour ${customer.name || 'client(e)'},\n\n` +
            `Sauf erreur de notre part, il semble que votre facture n°${sale.ticketNumber} d'un montant de ${totalDue.toFixed(2)}€, datée du ${new Date(sale.date as any).toLocaleDateString('fr-FR')}, soit toujours en attente de règlement.\n\n` +
            `Vous trouverez la facture en pièce jointe pour votre référence.\n\n` +
            `Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les plus brefs délais.` +
            companySignature
            );
        } else {
            setEmailSubject(`Votre ${pieceType} #${sale.ticketNumber}`);
            setEmailBody(
            `Bonjour ${customer.name || 'client(e)'},\n\n` +
            `Veuillez trouver ci-joint votre ${pieceType} n°${sale.ticketNumber}.` +
            companySignature
            );
        }
    } else {
        // Spontaneous email
        setEmailSubject(`Message de ${companyInfo?.name || 'votre entreprise'}`);
        setEmailBody(`Bonjour ${customer.name || 'client(e)'},\n\n` + companySignature);
    }
  }, [sale, customer, dunningMode, companyInfo, pieceType]);

  const handleSendEmail = async () => {
    if (!smtpConfig?.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.password || !smtpConfig.senderEmail) {
      toast({ 
        variant: 'destructive', 
        title: 'Configuration SMTP requise', 
        description: 'Veuillez configurer les paramètres SMTP avant d\'envoyer des e-mails.',
        action: <Button variant="secondary" size="sm" asChild><Link href="/settings/connectivity">Configurer</Link></Button>
      });
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
        attachments: attachments,
    });

    toast({
        variant: emailResult.success ? 'default' : 'destructive',
        title: emailResult.success ? 'E-mail envoyé !' : "Échec de l'envoi",
        description: emailResult.message,
    });
    setIsSending(false);
    if (onSend) {
      onSend(emailResult.success ? `E-mail envoyé avec succès à ${emailToSend}.` : `Échec de l'envoi : ${emailResult.message}`);
    }
    if (emailResult.success) {
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64Content = (loadEvent.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          filename: file.name,
          content: base64Content,
          encoding: 'base64'
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="absolute -left-[9999px] -top-[9999px]">
        {sale && vatRates && <InvoicePrintTemplate ref={printRef} sale={sale} customer={customer} companyInfo={companyInfo} vatRates={vatRates} />}
      </div>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
              <DialogTitle>
                  {dunningMode ? "Enregistrer une action de relance" : `Envoyer ${pieceType}`} - {sale?.ticketNumber || ''}
              </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0 space-y-4 flex-1 overflow-y-auto">
              <Card>
                <CardContent className="pt-6">
                   <div className="space-y-2">
                      <Label htmlFor="email-to">Destinataire</Label>
                      <div className="flex items-center gap-2">
                          <Input 
                            id="email-to" 
                            value={emailToSend} 
                            onChange={(e) => setEmailToSend(e.target.value)}
                            placeholder={customer ? "Email manquant" : "Aucun client associé"}
                          />
                     </div>
                  </div>
                </CardContent>
              </Card>

               <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contenu de l'e-mail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                          rows={6}
                          className="min-h-[120px]"
                      />
                  </div>
                </CardContent>
              </Card>

               <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Pièces jointes</CardTitle>
                      <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4" /> Fichier local
                          </Button>
                      </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-24 overflow-y-auto border rounded-md p-2 bg-muted/50">
                      {attachments.length === 0 && !isGeneratingPdf && <p className="text-sm text-center text-muted-foreground p-4">Aucune pièce jointe.</p>}
                      {isGeneratingPdf && <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Préparation du PDF...</div>}
                      <Table>
                        <TableBody>
                          {attachments.map((att, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium flex items-center gap-2">
                                  <File className="h-4 w-4 text-muted-foreground" />
                                  {att.filename}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeAttachment(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"/>
                </CardContent>
              </Card>
          </div>
          <DialogFooter className="p-4 border-t bg-muted/50">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              <Send className="mr-2 h-4 w-4" /> {isSending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
