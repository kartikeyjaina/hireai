import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContentSkeleton from "@/components/content-skeleton";
import EmptyState from "@/components/empty-state";
import MetricCard from "@/components/metric-card";
import SectionHeader from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getInterviews } from "@/lib/hireai-api";
import { formatDateTime } from "@/lib/format";

function InterviewerDashboardPage() {
  const { token, user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const response = await getInterviews(token, {
      interviewerId: user.id
    });
    setInterviews(response.items || []);
  }

  useEffect(() => {
    setIsLoading(true);
    refresh().catch(console.error).finally(() => setIsLoading(false));
  }, [token, user.id]);

  if (isLoading) {
    return <ContentSkeleton cards={2} detail={false} />;
  }

  const upcoming = interviews.filter((item) => item.status === "scheduled");
  const completed = interviews.filter((item) => item.status === "completed");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Interviewer"
        title={`Interview queue for ${user.firstName}`}
        description="Review assigned interviews, open candidate profiles, and keep feedback centralized in candidate collaboration notes."
        actions={
          <Button asChild>
            <Link to="/interviews">Open interview board</Link>
          </Button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="Assigned interviews" value={String(interviews.length)} delta="Total" tone="primary" />
        <MetricCard label="Upcoming" value={String(upcoming.length)} delta="Scheduled" tone="accent" />
        <MetricCard label="Completed" value={String(completed.length)} delta="Feedback delivered" tone="success" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Next interviews</CardTitle>
          <CardDescription>
            Jump to candidate details to add interview notes and collaboration feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {upcoming.slice(0, 6).map((interview) => (
            <div
              key={interview._id}
              className="rounded-[24px] border border-border/80 bg-secondary/40 px-5 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-foreground">{interview.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {interview.job?.title} | {interview.candidate?.firstName} {interview.candidate?.lastName}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(interview.scheduledAt)} | {interview.timezone}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="default">scheduled</Badge>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/candidates/${interview.candidate?._id}`}>
                      Candidate notes
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!upcoming.length ? (
            <EmptyState
              title="No upcoming interviews"
              description="Your next assigned interviews will appear here."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default InterviewerDashboardPage;
