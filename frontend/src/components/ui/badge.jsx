import { cn } from "@/lib/utils";

function Badge({ className, tone = "default", ...props }) {
  const tones = {
    default: "border-border/80 bg-secondary/70 text-secondary-foreground",
    success: "border-success/30 bg-success/15 text-success",
    primary: "border-primary/30 bg-primary/15 text-primary",
    accent: "border-accent/30 bg-accent/15 text-accent",
    warning: "border-warning/30 bg-warning/15 text-warning"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
