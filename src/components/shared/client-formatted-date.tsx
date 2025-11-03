
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';

interface ClientFormattedDateProps {
  date: Date | Timestamp | string | undefined;
  formatString: string;
}

export const ClientFormattedDate = ({ date, formatString }: ClientFormattedDateProps) => {
  const [formatted, setFormatted] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !date) {
        setFormatted('');
        return;
    };
    
    let jsDate: Date;
    if (date instanceof Date) {
      jsDate = date;
    } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as any).toDate === 'function') {
      jsDate = (date as Timestamp).toDate();
    } else {
      jsDate = new Date(date as any);
    }
    
    if (!isNaN(jsDate.getTime())) {
      setFormatted(format(jsDate, formatString, { locale: fr }));
    }
  }, [date, formatString, isClient]);

  if (!isClient) {
    return null; // Render nothing on the server to prevent mismatch
  }

  return <>{formatted}</>;
};
