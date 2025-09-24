import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Brush, Building, Lock } from 'lucide-react';

const settingsLinks = [
    {
        href: '/settings/customization',
        title: 'Interface Customization',
        description: 'Personalize colors, fonts, and button sizes.',
        icon: Brush
    },
    {
        href: '/settings/company',
        title: 'Company Details',
        description: 'Manage your business name, address, and contact info.',
        icon: Building
    },
    {
        href: '/settings/modes',
        title: 'Forced Modes',
        description: 'Lock the application into a specific mode.',
        icon: Lock
    }
]

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure and customize the application to your needs."
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map(link => (
            <Link href={link.href} key={link.href} className="group">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <link.icon className="h-8 w-8 text-primary mb-2" />
                                <h3 className="text-lg font-semibold font-headline">{link.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>
    </>
  );
}
