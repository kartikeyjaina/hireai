import { cn } from "@/lib/utils";

const roles = [
  { label: "Candidate", value: "candidate" },
  { label: "Recruiter", value: "recruiter" },
  { label: "Interviewer", value: "interviewer" },
];

function RoleSelector({ onChange, value }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">I am a</span>
      <div className="grid gap-2 sm:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium transition",
              value === role.value
                ? "border-primary/40 bg-primary/12 text-foreground"
                : "border-border/80 bg-secondary/45 text-muted-foreground hover:border-primary/25 hover:text-foreground"
            )}
            onClick={() => onChange(role.value)}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RoleSelector;
