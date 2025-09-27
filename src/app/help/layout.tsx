'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { helpData } from './help-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
            title="Assistance et Aide"
            subtitle="Trouvez les réponses à vos questions sur l'utilisation de l'application."
        >
            <Button asChild variant="outline" className="btn-back">
                <Link href="/dashboard">
                    <ArrowLeft />
                    Retour au tableau de bord
                </Link>
            </Button>
        </PageHeader>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
                <nav className="sticky top-24 flex flex-col gap-4">
                    {helpData.map((category) => (
                        <div key={category.category}>
                            <h3 className="mb-2 text-sm font-semibold text-muted-foreground tracking-wider">{category.category}</h3>
                            <div className="flex flex-col gap-1">
                            {category.topics.map((topic) => (
                                <Link
                                    key={topic.slug}
                                    href={`/help/${topic.slug}`}
                                    className={cn(
                                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        pathname === `/help/${topic.slug}`
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground/80 hover:bg-secondary'
                                    )}
                                >
                                    {topic.title}
                                </Link>
                            ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>
            <main className="md:col-span-3">
                {children}
            </main>
        </div>
    </div>
  );
}
