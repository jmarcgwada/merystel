'use client';

import React from 'react';
import type { SupportTicket, Customer, CompanyInfo } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';

interface TicketPrintTemplateProps {
  ticket: SupportTicket;
  customer: Customer | null;
  companyInfo: CompanyInfo | null;
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

export const TicketPrintTemplate = React.forwardRef<HTMLDivElement, TicketPrintTemplateProps>(({ ticket, customer, companyInfo }, ref) => {
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
                        <p className="text-xs text-gray-500">Client :</p>
                        <p className="font-bold leading-tight">{customer?.name || 'Client non spécifié'}</p>
                        <p className="leading-tight">{customer?.address}</p>
                        <p className="leading-tight">{customer?.postalCode} {customer?.city}</p>
                        <p className="leading-tight">{customer?.phone}</p>
                    </div>
                </div>
            </div>
             <div className="text-center mt-4">
                <h2 className="text-3xl font-bold uppercase text-gray-400">Fiche de Prise en Charge</h2>
                <div className="mt-2 text-gray-600">
                    <p><span className="font-semibold">Numéro :</span> {ticket.ticketNumber}</p>
                    <p><span className="font-semibold">Date :</span> <ClientFormattedDate date={ticket.createdAt} formatString="d MMMM yyyy" /></p>
                </div>
            </div>
        </header>
        
        <main className="space-y-6">
            <section className="break-inside-avoid">
                <h3 className="font-bold border-b-2 border-gray-800 pb-1 mb-2 text-lg">Matériel</h3>
                <table className="w-full text-left">
                    <tbody>
                        <tr><td className="font-semibold p-1 w-1/4">Type</td><td className="p-1">{ticket.equipmentType}</td></tr>
                        <tr><td className="font-semibold p-1">Marque</td><td className="p-1">{ticket.equipmentBrand}</td></tr>
                        <tr><td className="font-semibold p-1">Modèle</td><td className="p-1">{ticket.equipmentModel}</td></tr>
                    </tbody>
                </table>
                 {ticket.equipmentNotes && (
                    <div className="mt-2 p-2 bg-gray-50 text-xs rounded-md">
                        <h4 className="font-semibold mb-1">Observations sur le matériel :</h4>
                        <p className="whitespace-pre-wrap">{ticket.equipmentNotes}</p>
                    </div>
                )}
            </section>

             <section className="break-inside-avoid">
                <h3 className="font-bold border-b-2 border-gray-800 pb-1 mb-2 text-lg">Panne / Demande du client</h3>
                <p className="text-sm whitespace-pre-wrap">{ticket.issueDescription}</p>
                 {ticket.clientNotes && (
                    <div className="mt-2 p-2 bg-gray-50 text-xs rounded-md">
                        <h4 className="font-semibold mb-1">Observations du client :</h4>
                        <p className="whitespace-pre-wrap">{ticket.clientNotes}</p>
                    </div>
                )}
            </section>
            
             <section className="break-inside-avoid">
                <h3 className="font-bold border-b-2 border-gray-800 pb-1 mb-2 text-lg">Historique des réparations</h3>
                 {ticket.repairActions && ticket.repairActions.length > 0 ? (
                    <div className="space-y-3">
                        {ticket.repairActions.sort((a,b) => new Date(a.date as any).getTime() - new Date(b.date as any).getTime()).map(action => (
                            <div key={action.id} className="border-l-2 pl-3">
                                <p className="font-semibold">{action.title}</p>
                                <p className="text-xs text-gray-500 mb-1"><ClientFormattedDate date={action.date} formatString="d MMM yy, HH:mm" /> par {action.userName}</p>
                                <p className="text-sm whitespace-pre-wrap">{action.details}</p>
                            </div>
                        ))}
                    </div>
                 ) : <p className="text-sm text-gray-500 italic">Aucune action enregistrée pour le moment.</p>}
            </section>
            
            {ticket.notes && (
                <section className="p-4 bg-gray-50 rounded-md break-inside-avoid">
                    <h3 className="font-semibold text-gray-500 text-sm mb-2">Notes internes (Technicien)</h3>
                    <p className="text-sm whitespace-pre-wrap">{ticket.notes}</p>
                </section>
            )}

            {ticket.amount && ticket.amount > 0 && (
                 <section className="mt-8 flex justify-end break-inside-avoid">
                    <div className="w-1/2">
                         <table className="w-full">
                            <tbody>
                                <tr className="bg-gray-800 text-white text-lg"><td className="p-2 font-bold">Montant Devis</td><td className="p-2 text-right font-bold">{ticket.amount.toFixed(2)}€</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </main>
        
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

TicketPrintTemplate.displayName = 'TicketPrintTemplate';
