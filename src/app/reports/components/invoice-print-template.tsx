
'use client';

import React from 'react';
import type { Sale, Customer, CompanyInfo, VatRate, Item, Payment } from '@/lib/types';
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
    <table className="w-full text-xs">
        <thead>
            <tr className="bg-gray-100">
                <th className="p-1 text-left">Code</th>
                <th className="p-1 text-left">Taux</th>
                <th className="p-1 text-right">Base HT</th>
                <th className="p-1 text-right">Montant TVA</th>
            </tr>
        </thead>
        <tbody>
            {Object.entries(breakdown).map(([rate, values]) => (
                <tr key={rate}>
                    <td className="p-1">{values.code}</td>
                    <td className="p-1">{values.rate.toFixed(2)}%</td>
                    <td className="p-1 text-right">{values.base.toFixed(2)}€</td>
                    <td className="p-1 text-right">{values.total.toFixed(2)}€</td>
                </tr>
            ))}
        </tbody>
    </table>
  );
};

const PaymentsDetails = ({ payments, total, change }: { payments: Payment[], total: number, change?: number }) => {
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = total - totalPaid;

    if (payments.length === 0 && (!change || change === 0)) return null;

    return (
        <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-500 text-sm">Règlements</h3>
            <div className="space-y-1 text-sm border-t pt-2">
                {payments.map((p, index) => (
                    <div key={index} className="flex justify-between">
                        <span>{p.method.name} (<ClientFormattedDate date={p.date} formatString="dd/MM/yyyy" />)</span>
                        <span>{p.amount.toFixed(2)}€</span>
                    </div>
                ))}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm">
                 <div className="flex justify-between font-bold">
                    <span>Total Payé</span>
                    <span>{totalPaid.toFixed(2)}€</span>
                </div>
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
    <div ref={ref} className="p-10 bg-white text-gray-800 font-sans text-sm" style={{ width: '210mm', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
      <header className="flex justify-between items-end pb-4">
        <div className="w-1/2">
          <h1 className="text-2xl font-bold uppercase">{companyInfo?.name || 'Votre Entreprise'}</h1>
          <p>{companyInfo?.address}</p>
          <p>{companyInfo?.postalCode} {companyInfo?.city}</p>
          <p>{companyInfo?.phone}</p>
          <p>{companyInfo?.email}</p>
          <p>{companyInfo?.website}</p>
        </div>
        <div className="w-1/2 text-right">
            <h2 className="text-4xl font-bold uppercase text-gray-400">{pieceType}</h2>
            <p className="font-semibold mt-4">Numéro : {sale.ticketNumber}</p>
            <p>Date : <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" /></p>
        </div>
      </header>

      <section className="flex justify-end mt-[-1rem]">
        <div className="w-1/2 bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold text-gray-500 mb-2">Adressé à :</h3>
            <p className="font-bold">{customer?.name || 'Client au comptoir'}</p>
            <p>{customer?.address}</p>
            <p>{customer?.postalCode} {customer?.city}</p>
            <p>{customer?.email}</p>
        </div>
      </section>

      <section className="mt-8">
        <table className="w-full">
            <thead>
                <tr className="bg-gray-800 text-white">
                    <th className="p-2 text-left w-1/2">Désignation</th>
                    <th className="p-2 text-right">Qté</th>
                    <th className="p-2 text-right">P.U. HT</th>
                    <th className="p-2 text-right">TVA %</th>
                    <th className="p-2 text-right">Total HT</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map((item) => {
                    const vatInfo = vatRates.find(v => v.id === item.vatId);
                    const priceHT = item.price / (1 + (vatInfo?.rate || 0)/100);
                    const totalHT = item.quantity * priceHT * (1 - (item.discountPercent || 0)/100);
                    return (
                        <tr key={item.id} className="border-b">
                            <td className="p-2 align-top">{item.name}</td>
                            <td className="p-2 text-right align-top">{item.quantity}</td>
                            <td className="p-2 text-right align-top">{priceHT.toFixed(2)}€</td>
                            <td className="p-2 text-right align-top">{vatInfo?.rate.toFixed(2)}%</td>
                            <td className="p-2 text-right align-top">{totalHT.toFixed(2)}€</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
      </section>

      <section className="mt-8 flex justify-between items-start">
        <div className="w-2/5 border rounded-md p-2">
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

      <section className="mt-8">
        <div style={{ height: '6cm' }} className="w-full border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
            <p className="text-gray-400">Cadre pour communication (image, texte, etc.)</p>
        </div>
      </section>

      <footer className="mt-auto pt-8 text-center text-xs text-gray-500">
        <div className="border-t pt-4">
            <p className="whitespace-pre-wrap">{companyInfo?.notes}</p>
            <p className="mt-2">{companyInfo?.name} - {companyInfo?.legalForm} - SIRET : {companyInfo?.siret}</p>
            <p>IBAN : {companyInfo?.iban} - BIC : {companyInfo?.bic}</p>
        </div>
      </footer>
    </div>
  );
});

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';
