import { cn } from "@/lib/utils";

function AuthInput({
  className,
  error,
  label,
  multiline = false,
  ...props
}) {
  const Component = multiline ? "textarea" : "input";

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Component
        className={cn(
          "w-full rounded-2xl border bg-secondary/55 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
          multiline ? "min-h-28 py-3" : "h-12",
          error ? "border-destructive/60" : "border-border/80",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm text-red-200">{error}</span> : null}
    </label>
  );
}

export default AuthInput;
