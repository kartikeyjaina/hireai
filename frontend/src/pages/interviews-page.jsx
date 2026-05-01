import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { getInterviews } from "@/lib/hireai-api";
import { formatDateTime } from "@/lib/format";

function InterviewsPage() {
  const { token, user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const response = await getInterviews(token, {
      interviewerId: user.role === "interviewer" ? user.id : "",
    });
    setInterviews(response.items || []);
  }

  useEffect(() => {
    setIsLoading(true);
    refresh()
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token, user.id, user.role]);

  if (isLoading) {
    return <ContentSkeleton cards={1} detail={false} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Interview loop"
        title="Assigned interview schedule"
        description="Review upcoming sessions, jump into candidate detail, and keep feedback attached to candidate records."
        actions={
          <Button
            variant="secondary"
            onClick={() => refresh().catch(console.error)}
          >
            Refresh interviews
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming and completed interviews</CardTitle>
          <CardDescription>
            Interviewers can see only their assigned interviews, while admins
            and recruiters can view all.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {interviews.map((interview) => (
            <div
              key={interview._id}
              className="rounded-[24px] border border-border/80 bg-secondary/40 px-5 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-base font-semibold text-foreground">
                    {interview.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {interview.job?.title} | {interview.candidate?.firstName}{" "}
                    {interview.candidate?.lastName}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formatDateTime(interview.scheduledAt)} |{" "}
                    {interview.timezone}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    tone={
                      interview.status === "completed" ? "success" : "default"
                    }
                  >
                    {interview.status}
                  </Badge>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/candidates/${interview.candidate?._id}`}>
                      Open candidate
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!interviews.length ? (
            <EmptyState
              title="No interviews assigned"
              description="Once an interview is scheduled with you as an interviewer, it will show up here."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default InterviewsPage;
