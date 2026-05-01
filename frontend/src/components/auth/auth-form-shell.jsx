import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function AuthFormShell({
  children,
  error,
  formError,
  isSubmitting,
  onSubmit,
  submitLabel,
  footer
}) {
  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      {children}

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{error}</div>
          </div>
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-100">
          {formError}
        </div>
      ) : null}

      <Button className="mt-2 w-full" size="lg" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Please wait..." : submitLabel}
      </Button>

      <div className="text-center text-sm text-muted-foreground">{footer}</div>
    </form>
  );
}

export default AuthFormShell;
