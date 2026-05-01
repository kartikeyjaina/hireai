import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gradient-to-r from-secondary via-secondary/70 to-secondary",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
