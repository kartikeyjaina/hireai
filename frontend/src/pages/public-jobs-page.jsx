import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import PublicSiteShell from "@/components/public-site-shell";
import EmptyState from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicJobs } from "@/lib/hireai-api";

function JobsPageContent() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadJobs() {
      try {
        const response = await getPublicJobs();
        if (!ignore) {
          setJobs(response.items || []);
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

    loadJobs();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-border/70 bg-slate-950/55 px-6 py-10 shadow-panel sm:px-8">
        <Badge tone="accent">Open opportunities</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Browse active roles and apply without entering the internal hiring system.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Published jobs are available here for every visitor and for signed-in candidates. Internal recruiter workflows stay separated behind protected routes.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`job-skeleton-${index}`} className="border-border/80 bg-secondary/30">
              <CardHeader>
                <div className="h-6 w-40 rounded-full bg-secondary/80" />
                <div className="h-4 w-60 rounded-full bg-secondary/60" />
              </CardHeader>
              <CardContent>
                <div className="h-20 rounded-2xl bg-secondary/40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!isLoading && !jobs.length ? (
        <EmptyState
          title="No published jobs yet"
          description="Once the hiring team publishes openings, they will appear here."
        />
      ) : null}

      {!isLoading && jobs.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job._id} className="border-border/80 bg-secondary/25">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span>{job.department}</span>
                    </CardDescription>
                  </div>
                  <Badge tone="success">{job.experienceLevel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  {job.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{job.employmentType}</Badge>
                  {job.skills?.slice(0, 3).map((skill) => (
                    <Badge key={`${job._id}-${skill}`} tone="accent">
                      <Sparkles className="mr-1 h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link to={`/jobs/${job._id}`}>
                    View details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function PublicJobsPage() {
  return (
    <PublicSiteShell>
      <JobsPageContent />
    </PublicSiteShell>
  );
}

export default PublicJobsPage;
