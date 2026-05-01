import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
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
  generateInterviewQuestionsRequest,
  getInterviews,
} from "@/lib/hireai-api";
import { formatDateTime } from "@/lib/format";

function InterviewsPage() {
  const { token, user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questionsByInterviewId, setQuestionsByInterviewId] = useState({});
  const [generatingForInterviewId, setGeneratingForInterviewId] = useState("");
  const [generationErrors, setGenerationErrors] = useState({});

  async function refresh() {
    const response = await getInterviews(token, {
      interviewerId: user.role === "interviewer" ? user.id : "",
    });
    setInterviews(response.items || []);
  }

  async function handleGenerateQuestions(interview) {
    setGeneratingForInterviewId(interview._id);
    setGenerationErrors((current) => ({
      ...current,
      [interview._id]: "",
    }));

    try {
      const response = await generateInterviewQuestionsRequest(token, {
        candidateProfile: interview.candidate || {},
        jobTitle: interview.job?.title || interview.title,
        jobDescription: interview.job?.description || interview.notes || "",
        interviewStage: interview.type || "technical",
        questionCount: interview.type === "phone-screen" ? 5 : 6,
      });

      setQuestionsByInterviewId((current) => ({
        ...current,
        [interview._id]: response.result?.questions || [],
      }));
    } catch (error) {
      setGenerationErrors((current) => ({
        ...current,
        [interview._id]: error.message,
      }));
    } finally {
      setGeneratingForInterviewId("");
    }
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
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleGenerateQuestions(interview)}
                    disabled={generatingForInterviewId === interview._id}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {generatingForInterviewId === interview._id
                      ? "Generating..."
                      : "Generate questions"}
                  </Button>
                </div>
              </div>

              {generationErrors[interview._id] ? (
                <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">
                  {generationErrors[interview._id]}
                </div>
              ) : null}

              {questionsByInterviewId[interview._id]?.length ? (
                <div className="mt-4 space-y-3 rounded-[22px] border border-border/80 bg-background/60 p-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Generated interview questions
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on the candidate profile, role title, and interview stage.
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {questionsByInterviewId[interview._id].map((item, index) => (
                      <div
                        key={`${interview._id}-question-${index}`}
                        className="rounded-2xl border border-border/80 bg-secondary/35 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="accent">{item.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Question {index + 1}
                          </span>
                        </div>
                        <div className="mt-3 text-sm font-medium text-foreground">
                          {item.question}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {item.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
