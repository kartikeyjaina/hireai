import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { employmentTypes, experienceLevels } from "@/lib/constants";
import { generateJobDescriptionRequest } from "@/lib/hireai-api";
import { useAuth } from "@/context/auth-context";

const emptyJob = {
  title: "",
  department: "",
  location: "",
  employmentType: "full-time",
  experienceLevel: "mid",
  status: "open",
  description: "",
  requirements: "",
  responsibilities: "",
  skills: "",
  salaryMin: "",
  salaryMax: "",
  currency: "USD",
  companyOverview: "",
  goals: ""
};

function toFormState(job) {
  if (!job) {
    return emptyJob;
  }

  return {
    title: job.title || "",
    department: job.department || "",
    location: job.location || "",
    employmentType: job.employmentType || "full-time",
    experienceLevel: job.experienceLevel || "mid",
    status: job.status || "open",
    description: job.description || "",
    requirements: (job.requirements || []).join("\n"),
    responsibilities: (job.responsibilities || []).join("\n"),
    skills: (job.skills || []).join(", "),
    salaryMin: job.salaryMin || "",
    salaryMax: job.salaryMax || "",
    currency: job.currency || "USD",
    companyOverview: "",
    goals: ""
  };
}

function buildPayload(form) {
  return {
    title: form.title,
    department: form.department,
    location: form.location,
    employmentType: form.employmentType,
    experienceLevel: form.experienceLevel,
    status: form.status,
    description: form.description,
    requirements: form.requirements
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    responsibilities: form.responsibilities
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    skills: form.skills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
    salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
    currency: form.currency
  };
}

function JobEditor({ job, onSaved }) {
  const { token } = useAuth();
  const [form, setForm] = useState(emptyJob);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(toFormState(job));
    setError("");
  }, [job]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleGenerateDescription() {
    setIsGenerating(true);
    setError("");

    try {
      const response = await generateJobDescriptionRequest(token, {
        title: form.title,
        department: form.department,
        location: form.location,
        employmentType: form.employmentType,
        experienceLevel: form.experienceLevel,
        companyOverview: form.companyOverview,
        goals: form.goals
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        requiredSkills: form.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        preferredSkills: []
      });

      setForm((current) => ({
        ...current,
        description: response.result.summary,
        responsibilities: response.result.responsibilities.join("\n"),
        requirements: response.result.requirements.join("\n"),
        skills: response.result.skills.join(", ")
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{job ? "Edit role" : "Create a new role"}</CardTitle>
          <CardDescription>
            Write a role manually or use Gemini to generate a polished first draft.
          </CardDescription>
        </div>
        <Button variant="secondary" onClick={handleGenerateDescription} disabled={isGenerating}>
          <Sparkles className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate with AI"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="title" value={form.title} onChange={updateField} placeholder="Role title" className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none" />
          <input name="department" value={form.department} onChange={updateField} placeholder="Department" className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none" />
          <input name="location" value={form.location} onChange={updateField} placeholder="Location" className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none" />
          <select name="employmentType" value={form.employmentType} onChange={updateField} className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none">
            {employmentTypes.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select name="experienceLevel" value={form.experienceLevel} onChange={updateField} className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none">
            {experienceLevels.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select name="status" value={form.status} onChange={updateField} className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none">
            <option value="draft">draft</option>
            <option value="open">open</option>
            <option value="paused">paused</option>
            <option value="closed">closed</option>
          </select>
        </div>
        <textarea name="companyOverview" value={form.companyOverview} onChange={updateField} placeholder="Company overview for AI generation" className="min-h-24 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none" />
        <textarea name="goals" value={form.goals} onChange={updateField} placeholder="Business goals, one per line" className="min-h-24 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none" />
        <textarea name="description" value={form.description} onChange={updateField} placeholder="Role summary" className="min-h-28 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none" />
        <div className="grid gap-4 md:grid-cols-2">
          <textarea name="responsibilities" value={form.responsibilities} onChange={updateField} placeholder="Responsibilities, one per line" className="min-h-36 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none" />
          <textarea name="requirements" value={form.requirements} onChange={updateField} placeholder="Requirements, one per line" className="min-h-36 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none" />
        </div>
        <input name="skills" value={form.skills} onChange={updateField} placeholder="Skills, comma separated" className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none" />
        <div className="grid gap-4 md:grid-cols-3">
          <input name="salaryMin" value={form.salaryMin} onChange={updateField} placeholder="Salary min" className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none" />
          <input name="salaryMax" value={form.salaryMax} onChange={updateField} placeholder="Salary max" className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none" />
          <input name="currency" value={form.currency} onChange={updateField} placeholder="Currency" className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none" />
        </div>
        {error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        <div className="flex justify-end">
          <Button onClick={() => onSaved(buildPayload(form), job)}>{job ? "Save changes" : "Create role"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default JobEditor;
