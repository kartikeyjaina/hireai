import { useEffect, useState } from "react";
import ContentSkeleton from "@/components/content-skeleton";
import JobEditor from "@/components/job-editor";
import SectionHeader from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { createJob, getJobs, updateJob } from "@/lib/hireai-api";

function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function refreshJobs() {
    const response = await getJobs(token);
    setJobs(response.items);
  }

  useEffect(() => {
    setIsLoading(true);
    refreshJobs().catch(console.error).finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return <ContentSkeleton cards={2} detail={false} />;
  }

  async function handleSave(payload, job) {
    setError("");
    setIsSaving(true);

    try {
      if (job?._id) {
        await updateJob(token, job._id, payload);
      } else {
        await createJob(token, payload);
      }

      setSelectedJob(null);
      await refreshJobs();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Job system"
        title="Role creation and AI-generated job descriptions"
        description="Create and refine live job records, then use them as the source of truth for resume parsing context and pipeline grouping."
        actions={<Button onClick={() => setSelectedJob(null)}>New role</Button>}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Open roles</CardTitle>
            <CardDescription>
              Existing job records that feed candidate scoring and pipeline views.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {jobs.map((job) => (
              <button
                key={job._id}
                type="button"
                onClick={() => setSelectedJob(job)}
                className="rounded-[24px] border border-border/80 bg-secondary/40 px-4 py-4 text-left transition hover:border-primary/35 hover:bg-secondary/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-foreground">{job.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.department} | {job.location}
                    </div>
                  </div>
                  <Badge tone={job.status === "open" ? "success" : "default"}>
                    {job.status}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className={isSaving ? "pointer-events-none opacity-80" : ""}>
          <JobEditor job={selectedJob} onSaved={handleSave} />
        </div>
      </section>
    </div>
  );
}

export default JobsPage;
