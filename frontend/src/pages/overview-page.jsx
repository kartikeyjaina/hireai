import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import ContentSkeleton from "@/components/content-skeleton";
import MetricCard from "@/components/metric-card";
import SectionHeader from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getOverview } from "@/lib/hireai-api";
import { stageLabel } from "@/lib/format";

function OverviewPage({ mode = "recruiter" }) {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getOverview(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  const jobs = data?.jobs?.items || [];
  const candidates = data?.candidates?.items || [];
  const applications = data?.applications?.items || [];
  const metrics = [
    { label: "Open roles", value: String(jobs.filter((job) => job.status === "open").length), delta: `${jobs.length} total`, tone: "primary" },
    { label: "Candidates", value: String(candidates.length), delta: "Structured profiles", tone: "success" },
    { label: "Applications", value: String(applications.length), delta: "Live pipeline", tone: "accent" }
  ];

  if (isLoading) {
    return <ContentSkeleton />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={mode === "admin" ? "System control" : "Hiring ops"}
        title={
          mode === "admin"
            ? `Admin command center, ${user.firstName}`
            : `Welcome back, ${user.firstName}`
        }
        description={
          mode === "admin"
            ? "Monitor platform health, funnel progression, and team performance from one system-level view."
            : "Your overview reflects live backend records for jobs, candidates, and the recruiting pipeline."
        }
        actions={
          <Button asChild>
            <Link to="/pipeline">
              Open pipeline
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Recent applications</CardTitle>
            <CardDescription>Latest candidate movement across the hiring funnel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {applications.slice(0, 6).map((application) => (
              <div key={application._id} className="rounded-[22px] border border-border/80 bg-secondary/45 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-foreground">
                      {application.candidate?.firstName} {application.candidate?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{application.job?.title}</div>
                  </div>
                  <div className="text-sm text-primary">{stageLabel(application.stage)}</div>
                </div>
              </div>
            ))}
            {!applications.length ? (
              <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
                Upload a resume and attach it to a role to seed the pipeline.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flow health</CardTitle>
            <CardDescription>Quick pulse on role throughput and recruiter momentum.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[24px] border border-border/80 bg-secondary/45 p-5">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Pipeline trend
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {applications.length ? "Active" : "Needs input"}
              </div>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-secondary/45 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Recruiter footprint
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {user.role}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default OverviewPage;
