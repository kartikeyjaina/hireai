import { useEffect, useState } from "react";
import { LoaderCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitPublicApplication } from "@/lib/hireai-api";

function validate(values) {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "First name is required";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.resume) {
    errors.resume = "Resume is required";
  }

  return errors;
}

function PublicApplicationDialog({ job, open, onOpenChange, onSuccess }) {
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    resume: null,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        resume: null,
      });
      setErrors({});
      setServerError("");
      setIsSubmitting(false);
    }
  }, [open]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function updateResume(event) {
    const resume = event.target.files?.[0] || null;
    setValues((current) => ({ ...current, resume }));
    setErrors((current) => ({ ...current, resume: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const formData = new FormData();
    formData.append("jobId", job._id);
    formData.append("firstName", values.firstName.trim());
    formData.append("lastName", values.lastName.trim());
    formData.append("email", values.email.trim());
    formData.append("phone", values.phone.trim());
    formData.append("resume", values.resume);

    setIsSubmitting(true);

    try {
      await submitPublicApplication(formData);
      onOpenChange(false);
      onSuccess("Application submitted successfully");
    } catch (error) {
      setServerError(error.details?.[0] || error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-3 py-6 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-border/80 bg-surface p-6 shadow-panel">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full border border-border/80 p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="mb-6 flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Apply for {job?.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            Share your details and resume. We will parse the file and create your application immediately.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">First name</span>
              <input
                className="h-11 rounded-2xl border border-border/80 bg-secondary/45 px-4 text-foreground outline-none transition focus:border-primary/50"
                name="firstName"
                onChange={updateField}
                value={values.firstName}
              />
              {errors.firstName ? <span className="text-xs text-red-300">{errors.firstName}</span> : null}
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Last name</span>
              <input
                className="h-11 rounded-2xl border border-border/80 bg-secondary/45 px-4 text-foreground outline-none transition focus:border-primary/50"
                name="lastName"
                onChange={updateField}
                value={values.lastName}
              />
              {errors.lastName ? <span className="text-xs text-red-300">{errors.lastName}</span> : null}
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-foreground">Email</span>
            <input
              className="h-11 rounded-2xl border border-border/80 bg-secondary/45 px-4 text-foreground outline-none transition focus:border-primary/50"
              name="email"
              onChange={updateField}
              type="email"
              value={values.email}
            />
            {errors.email ? <span className="text-xs text-red-300">{errors.email}</span> : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-foreground">Phone</span>
            <input
              className="h-11 rounded-2xl border border-border/80 bg-secondary/45 px-4 text-foreground outline-none transition focus:border-primary/50"
              name="phone"
              onChange={updateField}
              value={values.phone}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-foreground">Resume</span>
            <div className="rounded-[24px] border border-dashed border-border/80 bg-secondary/30 p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                PDF, DOCX, or TXT up to 8MB
              </div>
              <input
                className="mt-3 block w-full text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={updateResume}
                type="file"
              />
            </div>
            {values.resume ? (
              <span className="text-xs text-muted-foreground">{values.resume.name}</span>
            ) : null}
            {errors.resume ? <span className="text-xs text-red-300">{errors.resume}</span> : null}
          </label>

          {serverError ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">
              {serverError}
            </div>
          ) : null}

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : "Submit application"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default PublicApplicationDialog;
