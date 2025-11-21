
'use client';

import React from 'react';
import type { Sale, Customer, CompanyInfo, VatRate, Payment } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';

interface InvoicePrintTemplateProps {
  sale: Sale;
  customer: Customer | null;
  companyInfo: CompanyInfo | null;
  vatRates: VatRate[];
}

const ClientFormattedDate = ({ date, formatString }: { date: Date | Timestamp | undefined, formatString: string}) => {
    if (!date) return <span>Date non disponible</span>;
    let jsDate: Date;
    if (date instanceof Date) jsDate = date;
    else if (date && typeof (date as Timestamp)?.toDate === 'function') jsDate = (date as Timestamp).toDate();
    else jsDate = new Date(date as any);

    if (isNaN(jsDate.getTime())) return <span>Date invalide</span>;
    return <span>{format(jsDate, formatString, { locale: fr })}</span>;
}

const VatBreakdownTable = ({ sale, vatRates }: { sale: Sale, vatRates: VatRate[] }) => {
  const breakdown: { [key: string]: { rate: number; total: number; base: number; code: number } } = {};
  
  sale.items.forEach(item => {
    const vatInfo = vatRates.find(v => v.id === item.vatId);
    if(vatInfo) {
      const priceHT = item.total / (1 + (vatInfo.rate / 100));
      const taxAmount = item.total - priceHT;
      
      if(breakdown[vatInfo.rate]) {
        breakdown[vatInfo.rate].base += priceHT;
        breakdown[vatInfo.rate].total += taxAmount;
      } else {
        breakdown[vatInfo.rate] = { rate: vatInfo.rate, total: taxAmount, base: priceHT, code: vatInfo.code };
      }
    }
  });

  return (
    <div className="border rounded-md p-2 break-inside-avoid w-full">
        <h3 className="font-semibold text-gray-500 text-sm mb-2">Détail TVA</h3>
        <table className="w-full text-xs">
            <thead>
                <tr className="bg-gray-100">
                    <th className="p-1 text-left">Code</th>
                    <th className="p-1 text-right">Base HT</th>
                    <th className="p-1 text-right">Montant TVA</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(breakdown).map(([rate, values]) => (
                    <tr key={rate}>
                        <td className="p-1">{values.code} ({parseFloat(rate).toFixed(2)}%)</td>
                        <td className="p-1 text-right">{values.base.toFixed(2)}€</td>
                        <td className="p-1 text-right">{values.total.toFixed(2)}€</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

const PaymentsDetails = ({ payments, total, change }: { payments: Payment[], total: number, change?: number }) => {
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = total - totalPaid;

    if (payments.length === 0 && balanceDue <= 0.01) return null;

    return (
        <div className="border rounded-md p-2 break-inside-avoid w-full">
            <h3 className="font-semibold text-gray-500 text-sm mb-2">Règlements</h3>
            <div className="space-y-1 text-sm border-t pt-2">
                {payments.map((p, index) => (
                    <div key={index} className="flex justify-between">
                        <span>{p.method.name} (<ClientFormattedDate date={p.date} formatString="dd/MM/yyyy" />)</span>
                        <span>{p.amount.toFixed(2)}€</span>
                    </div>
                ))}
            </div>
             <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                {payments.length > 0 && (
                    <div className="flex justify-between font-bold">
                        <span>Total Payé</span>
                        <span>{totalPaid.toFixed(2)}€</span>
                    </div>
                )}
                 {change && change > 0 && (
                     <div className="flex justify-between text-gray-600">
                        <span>Monnaie Rendue</span>
                        <span>- {change.toFixed(2)}€</span>
                    </div>
                 )}
                 {balanceDue > 0.01 && (
                     <div className="flex justify-between font-bold text-red-600">
                        <span>Solde Dû</span>
                        <span>{balanceDue.toFixed(2)}€</span>
                    </div>
                 )}
            </div>
        </div>
    );
}

export const InvoicePrintTemplate = React.forwardRef<HTMLDivElement, InvoicePrintTemplateProps>(({ sale, customer, companyInfo, vatRates }, ref) => {
  const pieceType = sale?.documentType === 'invoice' ? 'Facture'
                  : sale?.documentType === 'quote' ? 'Devis'
                  : sale?.documentType === 'delivery_note' ? 'Bon de Livraison'
                  : sale?.documentType === 'credit_note' ? 'Avoir'
                  : 'Ticket';

  const subtotal = sale.items.reduce((acc, item) => {
    const vatRate = vatRates.find(v => v.id === item.vatId)?.rate || 0;
    const priceHT = item.total / (1 + vatRate / 100);
    return acc + priceHT;
  }, 0);

  return (
    <div ref={ref} className="bg-white text-gray-800 font-sans text-sm" style={{ width: '210mm' }}>
      <div className="print-content p-10"> 
        <header className="mb-8 break-inside-avoid">
             <div className="flex justify-between items-start mb-6">
                <div className="w-1/2 space-y-0.5">
                    <h1 className="text-xl font-bold uppercase mb-2">{companyInfo?.name || 'Votre Entreprise'}</h1>
                    <p className="leading-tight">{companyInfo?.address}</p>
                    <p className="leading-tight">{companyInfo?.postalCode} {companyInfo?.city}</p>
                    <p className="leading-tight">{companyInfo?.phone}</p>
                    <p className="leading-tight">{companyInfo?.email}</p>
                    <p className="leading-tight">{companyInfo?.website}</p>
                </div>
                 <div className="w-1/2 flex flex-col items-end">
                    <div className="bg-gray-100 p-4 rounded-md space-y-0.5 w-full max-w-xs">
                        <p className="text-xs text-gray-500">Adressé à :</p>
                        <p className="font-bold leading-tight">{customer?.name || 'Client au comptoir'}</p>
                        <p className="leading-tight">{customer?.address}</p>
                        <p className="leading-tight">{customer?.postalCode} {customer?.city}</p>
                    </div>
                </div>
            </div>
             <div className="text-center mt-4">
                <h2 className="text-3xl font-bold uppercase text-gray-400">{pieceType}</h2>
                <div className="mt-2 text-gray-600">
                    <p><span className="font-semibold">Numéro :</span> {sale.ticketNumber}</p>
                    <p><span className="font-semibold">Date :</span> <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" /></p>
                </div>
            </div>
        </header>
        
        <main>
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-800 text-white">
                        <th className="p-2 text-left w-[45%]">Désignation</th>
                        <th className="p-2 text-right w-[10%]">Qté</th>
                        <th className="p-2 text-right w-[15%]">P.U. HT</th>
                        <th className="p-2 text-right w-[15%]">Code TVA</th>
                        <th className="p-2 text-right w-[15%]">Total HT</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item) => {
                        const vatInfo = vatRates.find(v => v.id === item.vatId);
                        const priceHT = item.price / (1 + (vatInfo?.rate || 0)/100);
                        const totalHT = (item.price * item.quantity * (1 - (item.discountPercent || 0)/100)) / (1 + (vatInfo?.rate || 0)/100);
                        const isSupportTicketItem = item.name.toLowerCase().includes('prise en charge sav');
                        return (
                            <tr key={item.id} className="border-b">
                                <td className="p-2 align-top">
                                  <p className="font-semibold">{item.name}</p>
                                  {item.description && (isSupportTicketItem || item.description) && <p className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{item.description}</p>}
                                </td>
                                <td className="p-2 text-right align-top">{item.quantity}</td>
                                <td className="p-2 text-right align-top">{priceHT.toFixed(2)}€</td>
                                <td className="p-2 text-right align-top">{vatInfo?.code || ''}</td>
                                <td className="p-2 text-right align-top">{totalHT.toFixed(2)}€</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </main>
        
        {sale.notes && (
            <div className="mt-8 p-4 bg-gray-50 rounded-md break-inside-avoid">
                <h3 className="font-semibold text-gray-500 text-sm mb-2">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
            </div>
        )}
        
        {companyInfo?.communicationDoc && (
        <section className="my-8 break-inside-avoid">
            <div className="w-full border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center p-4 min-h-[4cm]">
                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {companyInfo.communicationDoc.startsWith('data:image') ? (
                    <img src={companyInfo.communicationDoc} alt="Communication" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                    <p className="text-gray-500">Aperçu PDF non disponible, mais le document sera inclus.</p>
                    )}
                </div>
            </div>
        </section>
        )}

        <section className="mt-8 flex justify-between items-start break-inside-avoid">
            <div className="w-1/2 space-y-4">
                <VatBreakdownTable sale={sale} vatRates={vatRates} />
                <PaymentsDetails payments={sale.payments || []} total={sale.total} change={sale.change}/>
            </div>
            <div className="w-2/5 space-y-2">
                <table className="w-full">
                    <tbody>
                        <tr><td className="p-2">Total HT</td><td className="p-2 text-right font-bold">{subtotal.toFixed(2)}€</td></tr>
                        <tr><td className="p-2">Total TVA</td><td className="p-2 text-right font-bold">{sale.tax.toFixed(2)}€</td></tr>
                        <tr className="bg-gray-800 text-white text-lg"><td className="p-2 font-bold">Total TTC</td><td className="p-2 text-right font-bold">{sale.total.toFixed(2)}€</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        {companyInfo?.notes && (
            <div className="mt-8 pt-4 border-t text-xs text-gray-500 break-inside-avoid">
                <p className="whitespace-pre-wrap">{companyInfo.notes}</p>
            </div>
        )}
      </div>

       <footer className="print-footer p-10 pt-4 text-center text-xs text-gray-500 border-t">
          <p>{companyInfo?.name} - {companyInfo?.legalForm} - SIRET : {companyInfo?.siret} - IBAN : {companyInfo?.iban} - BIC : {companyInfo?.bic}</p>
      </footer>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            width: 210mm;
            height: 297mm;
            font-family: sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-content {
             padding-bottom: 2cm; /* Margin for the footer */
          }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 10mm;
            font-size: 9pt;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
});

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';
