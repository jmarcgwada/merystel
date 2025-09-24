import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function CustomizationPage() {
  return (
    <>
      <PageHeader
        title="Interface Customization"
        subtitle="Personalize the look and feel of your POS."
      />
      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-center text-muted-foreground py-12">
                <p>Live color customization options will be available here.</p>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Sizing & Opacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid gap-2">
                <Label>Category Button Opacity</Label>
                <Slider defaultValue={[80]} max={100} step={1} />
             </div>
              <div className="grid gap-2">
                <Label>Table Button Size</Label>
                <Slider defaultValue={[50]} max={100} step={1} />
             </div>
             <div className="text-center text-muted-foreground py-8">
                <p>More sliders and real-time previews will be implemented.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
