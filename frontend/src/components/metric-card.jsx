import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function MetricCard({ label, value, delta, tone }) {
  return (
    <Card className="group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <Badge tone={tone}>{delta}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
        <div className="rounded-full border border-border/80 p-2 text-muted-foreground transition group-hover:border-primary/30 group-hover:text-primary">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricCard;
