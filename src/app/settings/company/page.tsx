import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompanyPage() {
  return (
    <>
      <PageHeader
        title="Company Details"
        subtitle="Manage your business information."
      />
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="Zenith POS Inc." />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Market St, San Francisco, CA" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="contact@zenithpos.com" />
            </div>
            <div className="flex justify-end pt-4">
                <Button>Save Changes</Button>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
