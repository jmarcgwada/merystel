
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ItemFormRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        router.replace(`/management/items?${params.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="h-full flex items-center justify-center">
            <p>Redirection en cours...</p>
        </div>
    );
}
