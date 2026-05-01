import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, MapPin, Sparkles } from "lucide-react";
import ContentSkeleton from "@/components/content-skeleton";
import EmptyState from "@/components/empty-state";
import SectionHeader from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  getCandidateJobs,
  getCandidateApplications,
  applyToJobAsCandidate,
} from "@/lib/hireai-api";
import { formatRelativeDate, stageLabel } from "@/lib/format";

const STAGE_TONE = {
  applied: "default",
  screening: "accent",
  shortlisted: "primary",
  interview: "accent",
  offer: "success",
  hired: "success",
  rejected: "destructive",
};

function CandidateDashboardPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  async function loadData() {
    const [jobsRes, appsRes] = await Promise.all([
      getCandidateJobs(token),
      getCandidateApplications(token),
    ]);
    setJobs(jobsRes.items || []);
    setApplications(appsRes.items || []);
  }

  useEffect(() => {
    setIsLoading(true);
    loadData()
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  const appliedJobIds = new Set(
    applications.map((app) => app.job?._id).filter(Boolean)
  );

  async function handleApply(jobId) {
    setApplyingJobId(jobId);
    setApplyError("");
    setApplySuccess("");

    try {
      await applyToJobAsCandidate(token, jobId);
      setApplySuccess("Application submitted successfully.");
      await loadData();
    } catch (error) {
      setApplyError(error.message);
    } finally {
      setApplyingJobId(null);
    }
  }

  if (isLoading) {
    return <ContentSkeleton />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Candidate portal"
        title="Browse jobs and track your applications"
        description="Apply to published roles and follow your application progress through the hiring pipeline."
      />

      {applyError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">
          {applyError}
        </div>
      ) : null}

      {applySuccess ? (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {applySuccess}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Open Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Open positions</CardTitle>
            <CardDescription>
              Published roles you can apply to directly from your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {jobs.length === 0 ? (
              <EmptyState
                title="No open positions"
                description="Check back soon — new roles will appear here when published."
              />
            ) : null}
            {jobs.map((job) => {
              const alreadyApplied = appliedJobIds.has(job._id);
              const isApplying = applyingJobId === job._id;

              return (
                <div
                  key={job._id}
                  className="rounded-[24px] border border-border/80 bg-secondary/40 px-5 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-foreground">
                        {job.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {job.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge>{job.employmentType}</Badge>
                        <Badge tone="accent">{job.experienceLevel}</Badge>
                        {(job.skills || []).slice(0, 3).map((skill) => (
                          <Badge key={skill} tone="primary">
                            <Sparkles className="mr-1 h-3 w-3" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/jobs/${job._id}`}>
                          Details
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {alreadyApplied ? (
                        <Badge tone="success">Applied</Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isApplying}
                          onClick={() => handleApply(job._id)}
                        >
                          {isApplying ? "Applying..." : "Apply"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* My Applications */}
        <Card>
          <CardHeader>
            <CardTitle>My applications</CardTitle>
            <CardDescription>
              Track where you stand in each hiring pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {applications.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">
                You haven't applied to any roles yet.
              </div>
            ) : null}
            {applications.map((app) => (
              <div
                key={app._id}
                className="rounded-[22px] border border-border/80 bg-secondary/40 p-4"
              >
                <div className="text-sm font-semibold text-foreground">
                  {app.job?.title || "Role"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {app.job?.department} · {app.job?.location}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Badge tone={STAGE_TONE[app.stage] || "default"}>
                    {stageLabel(app.stage)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Applied {formatRelativeDate(app.appliedAt)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default CandidateDashboardPage;
