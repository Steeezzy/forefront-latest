import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ToolCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tool Name</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Tool description goes here.</p>
            </CardContent>
        </Card>
    );
}
