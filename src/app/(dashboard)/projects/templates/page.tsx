import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TemplatesComingSoon() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coming Soon</h1>
          <p className="text-muted-foreground">Project Templates will be implemented later.</p>
        </div>
      </div>
      <div className="flex justify-center items-center min-h-[300px]">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="mb-4">This feature is coming soon. Stay tuned!</p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
