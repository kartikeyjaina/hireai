import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function JobModal({ open, onOpenChange }) {
  const [formValues, setFormValues] = useState({
    title: "Senior Product Designer",
    department: "Design",
    brief:
      "We need a systems-minded product designer who can partner across product, engineering, and recruiting operations."
  });

  function updateField(event) {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new role</DialogTitle>
          <DialogDescription>
            Phase 2 establishes the modal system and form surface patterns that later
            phases will connect to live job creation workflows.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Role title</span>
              <input
                name="title"
                className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                value={formValues.title}
                onChange={updateField}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Department</span>
              <input
                name="department"
                className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                value={formValues.department}
                onChange={updateField}
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">Hiring brief</span>
              <textarea
                name="brief"
                className="min-h-32 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                value={formValues.brief}
                onChange={updateField}
              />
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Continue setup</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default JobModal;
