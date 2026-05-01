import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, MapPin, Sparkles } from "lucide-react";
import PublicApplicationDialog from "@/components/public-application-dialog";
import PublicSiteShell from "@/components/public-site-shell";
import ToastBanner from "@/components/toast-banner";
import EmptyState from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicJob } from "@/lib/hireai-api";

function PublicJobDetailsContent() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadJob() {
      try {
        const response = await getPublicJob(id);
        if (!ignore) {
          setJob(response.job || null);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadJob();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-36 rounded-full bg-secondary/50" />
        <div className="h-64 rounded-[32px] bg-secondary/35" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <EmptyState
        title="Job not found"
        description={error || "This role is unavailable or no longer published."}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Button asChild variant="ghost">
          <Link to="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to jobs
          </Link>
        </Button>

        <Card className="border-border/80 bg-slate-950/55">
          <CardHeader className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge tone="success">Published role</Badge>
                <CardTitle className="text-3xl sm:text-4xl">{job.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {job.employmentType}
                  </span>
                  <span>{job.experienceLevel}</span>
                </div>
              </div>
              <Button onClick={() => setApplyOpen(true)}>Apply now</Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground">Role overview</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {job.description}
                </p>
              </section>

              {job.responsibilities?.length ? (
                <section>
                  <h2 className="text-lg font-semibold text-foreground">Responsibilities</h2>
                  <div className="mt-3 grid gap-3">
                    {job.responsibilities.map((item, index) => (
                      <div
                        key={`responsibility-${index}`}
                        className="rounded-2xl border border-border/80 bg-secondary/25 px-4 py-3 text-sm text-muted-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {job.requirements?.length ? (
                <section>
                  <h2 className="text-lg font-semibold text-foreground">Requirements</h2>
                  <div className="mt-3 grid gap-3">
                    {job.requirements.map((item, index) => (
                      <div
                        key={`requirement-${index}`}
                        className="rounded-2xl border border-border/80 bg-secondary/25 px-4 py-3 text-sm text-muted-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-border/80 bg-secondary/25 p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Snapshot
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em]">Department</div>
                    <div className="mt-1 text-foreground">{job.department}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em]">Experience</div>
                    <div className="mt-1 text-foreground">{job.experienceLevel}</div>
                  </div>
                  {job.salaryMin || job.salaryMax ? (
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em]">Compensation</div>
                      <div className="mt-1 text-foreground">
                        {job.currency} {job.salaryMin || 0} - {job.salaryMax || "Open"}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {job.skills?.length ? (
                <div className="rounded-[28px] border border-border/80 bg-secondary/25 p-5">
                  <div className="text-sm font-semibold text-foreground">Core skills</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} tone="accent">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <PublicApplicationDialog
        job={job}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        onSuccess={setToastMessage}
      />
      <ToastBanner message={toastMessage} />
    </>
  );
}

function PublicJobDetailsPage() {
  return (
    <PublicSiteShell>
      <PublicJobDetailsContent />
    </PublicSiteShell>
  );
}

export default PublicJobDetailsPage;
