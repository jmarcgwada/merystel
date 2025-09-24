import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function ModesPage() {
  return (
    <>
      <PageHeader
        title="Forced Modes"
        subtitle="Lock the application into a specific mode for certain users."
      />
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Mode Configuration</CardTitle>
          <CardDescription>
            Enable a mode to lock the app. A special key combination will be required to unlock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="touch-mode" className="text-base">Force Touchscreen Mode</Label>
              <p className="text-sm text-muted-foreground">
                Locks the app to the main Point of Sale screen.
              </p>
            </div>
            <Switch id="touch-mode" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="restaurant-mode" className="text-base">Force Restaurant Mode</Label>
               <p className="text-sm text-muted-foreground">
                Locks the app to the Restaurant table management view.
              </p>
            </div>
            <Switch id="restaurant-mode" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
