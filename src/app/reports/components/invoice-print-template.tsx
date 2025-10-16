
'use client';

import React from 'react';
import type { Sale, Customer, CompanyInfo, VatRate, Item } from '@/lib/types';
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


export const InvoicePrintTemplate = React.forwardRef<HTMLDivElement, InvoicePrintTemplateProps>(({ sale, customer, companyInfo, vatRates }, ref) => {
  const pieceType = sale?.documentType === 'invoice' ? 'Facture'
                  : sale?.documentType === 'quote' ? 'Devis'
                  : sale?.documentType === 'delivery_note' ? 'Bon de Livraison'
                  : sale?.documentType === 'credit_note' ? 'Avoir'
                  : 'Ticket';

  const subtotal = sale.items.reduce((acc, item) => acc + (item.total / (1 + (vatRates.find(v => v.id === item.vatId)?.rate || 0)/100)), 0);

  return (
    <div ref={ref} className="p-10 bg-white text-gray-800 font-sans text-sm" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <header className="flex justify-between items-start pb-8 border-b-2 border-gray-800">
        <div className="w-2/3">
          <h1 className="text-2xl font-bold uppercase">{companyInfo?.name || 'Votre Entreprise'}</h1>
          <p>{companyInfo?.address}</p>
          <p>{companyInfo?.postalCode} {companyInfo?.city}</p>
          <p>{companyInfo?.phone}</p>
          <p>{companyInfo?.email}</p>
          <p>{companyInfo?.website}</p>
        </div>
        <div className="w-1/3 text-right">
            <h2 className="text-4xl font-bold uppercase text-gray-400">{pieceType}</h2>
            <p className="font-semibold mt-4">Numéro : {sale.ticketNumber}</p>
            <p>Date : <ClientFormattedDate date={sale.date} formatString="d MMMM yyyy" /></p>
        </div>
      </header>

      {/* Customer Info */}
      <section className="mt-8">
        <div className="w-1/2 bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold text-gray-500 mb-2">Adressé à :</h3>
            <p className="font-bold">{customer?.name || 'Client au comptoir'}</p>
            <p>{customer?.address}</p>
            <p>{customer?.postalCode} {customer?.city}</p>
            <p>{customer?.email}</p>
        </div>
      </section>

      {/* Items Table */}
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

      {/* Totals & VAT */}
      <section className="mt-8 flex justify-end">
        <div className="w-1/2 space-y-4">
            <table className="w-full">
                <tbody>
                    <tr><td className="p-2">Total HT</td><td className="p-2 text-right font-bold">{subtotal.toFixed(2)}€</td></tr>
                    <tr><td className="p-2">Total TVA</td><td className="p-2 text-right font-bold">{sale.tax.toFixed(2)}€</td></tr>
                    <tr className="bg-gray-800 text-white text-lg"><td className="p-2 font-bold">Total TTC</td><td className="p-2 text-right font-bold">{sale.total.toFixed(2)}€</td></tr>
                </tbody>
            </table>
            <VatBreakdownTable sale={sale} vatRates={vatRates} />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-8 border-t text-center text-xs text-gray-500">
        <p>{companyInfo?.name} - {companyInfo?.legalForm} - SIRET : {companyInfo?.siret}</p>
        <p>IBAN : {companyInfo?.iban} - BIC : {companyInfo?.bic}</p>
      </footer>
    </div>
  );
});

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';
