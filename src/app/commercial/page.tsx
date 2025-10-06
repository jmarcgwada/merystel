
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CommercialPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/commercial/invoices');
    }, [router]);

    return (
        <div className="h-full flex items-center justify-center">
            <p>Redirection en cours...</p>
        </div>
    );
}
