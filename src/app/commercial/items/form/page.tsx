

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedItemFormPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/management/items');
    }, [router]);

    return (
        <div className="h-full flex items-center justify-center">
            <p>Redirection en cours...</p>
        </div>
    );
}
