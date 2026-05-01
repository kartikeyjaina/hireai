import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ContentSkeleton from "@/components/content-skeleton";
import MetricCard from "@/components/metric-card";
import SectionHeader from "@/components/section-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getHiringAnalyticsRequest, getJobs } from "@/lib/hireai-api";
import { stageLabel } from "@/lib/format";

const funnelColors = [
  "#38bdf8",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#f97316",
  "#10b981",
  "#ef4444"
];

const tooltipStyle = {
  background: "rgba(15, 23, 42, 0.96)",
  border: "1px solid rgba(56, 189, 248, 0.18)",
  borderRadius: 18,
  color: "#e2e8f0"
};

function AnalyticsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getJobs(token).then((response) => setJobs(response.items)).catch(console.error);
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    getHiringAnalyticsRequest(token, selectedJobId)
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedJobId, token]);

  if (isLoading) {
    return <ContentSkeleton />;
  }

  const summary = analytics?.summary || {
    totalApplications: 0,
    totalHires: 0,
    averageTimeToHire: 0,
    overallConversionRate: 0
  };

  const metrics = [
    {
      label: "Applications",
      value: String(summary.totalApplications),
      delta: "Tracked across the funnel",
      tone: "primary"
    },
    {
      label: "Overall conversion",
      value: `${summary.overallConversionRate}%`,
      delta: "Applied to hired",
      tone: "success"
    },
    {
      label: "Avg. time to hire",
      value: `${summary.averageTimeToHire} days`,
      delta: "For completed hires",
      tone: "accent"
    }
  ];

  const funnel = (analytics?.funnel || []).map((item) => ({
    ...item,
    label: stageLabel(item.stage)
  }));

  const conversion = (analytics?.conversion || []).map((item) => ({
    ...item,
    label: stageLabel(item.stage)
  }));

  const currentStageBreakdown = (analytics?.currentStageBreakdown || []).map((item) => ({
    ...item,
    label: stageLabel(item.stage)
  }));

  const jobConversion = analytics?.perJobConversion || [];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analytics"
        title="Hiring funnel, conversion, and time-to-hire"
        description="Analytics are now computed from real application history instead of static dashboard summaries."
        actions={
          <select
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            className="h-11 rounded-full border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          >
            <option value="">All jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title}
              </option>
            ))}
          </select>
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Hiring funnel</CardTitle>
            <CardDescription>
              How many applications reached each stage of the recruiting process.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[14, 14, 0, 0]}>
                  {funnel.map((entry, index) => (
                    <Cell key={entry.stage} fill={funnelColors[index % funnelColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-stage conversion</CardTitle>
            <CardDescription>
              Transition efficiency between one stage and the next.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversion}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#38bdf8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Current stage distribution</CardTitle>
            <CardDescription>
              Where applications are sitting right now across the active pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentStageBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#22c55e" radius={[14, 14, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time to hire detail</CardTitle>
            <CardDescription>
              Completed hires and the number of days from application to hire.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(analytics?.timeToHire?.hires || []).map((item) => (
              <div
                key={item.applicationId}
                className="rounded-[22px] border border-border/80 bg-secondary/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">
                      {item.candidateName || "Candidate"}
                    </div>
                    <div className="text-sm text-muted-foreground">{item.jobTitle}</div>
                  </div>
                  <div className="text-sm text-primary">{item.daysToHire} days</div>
                </div>
              </div>
            ))}
            {!(analytics?.timeToHire?.hires || []).length ? (
              <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">
                No hires yet, so time-to-hire metrics are not available.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Role conversion table</CardTitle>
            <CardDescription>
              How individual roles are converting from applicants to hires.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {jobConversion.map((item) => (
              <div
                key={item.jobId}
                className="rounded-[22px] border border-border/80 bg-secondary/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary">{item.conversionRate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {item.hired}/{item.applied} hired
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!jobConversion.length ? (
              <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">
                No role-level analytics yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default AnalyticsPage;
