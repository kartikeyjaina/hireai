import { useEffect, useState } from "react";
import { CalendarPlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  createInterviewRequest,
  getInterviews,
  getUserDirectory
} from "@/lib/hireai-api";
import { formatDateTime } from "@/lib/format";

function InterviewScheduler({ applications, candidateId }) {
  const { token } = useAuth();
  const [team, setTeam] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [form, setForm] = useState({
    application: applications[0]?._id || "",
    job: applications[0]?.job?._id || "",
    candidate: candidateId,
    title: "",
    type: "technical",
    status: "scheduled",
    scheduledAt: "",
    durationMinutes: 60,
    timezone: "Asia/Calcutta",
    meetingUrl: "",
    notes: "",
    interviewers: []
  });

  async function refreshInterviews() {
    const response = await getInterviews(token, { candidateId });
    setInterviews(response.items);
  }

  useEffect(() => {
    getUserDirectory(token)
      .then((response) => setTeam(response.items))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (applications.length && !form.application) {
      setForm((current) => ({
        ...current,
        application: applications[0]._id,
        job: applications[0].job?._id || ""
      }));
    }

    setIsLoading(true);
    refreshInterviews().catch(console.error).finally(() => setIsLoading(false));
  }, [applications, candidateId, form.application, token]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleCreate() {
    setIsScheduling(true);
    try {
      await createInterviewRequest(token, {
        ...form,
        interviewers: form.interviewers
      });

      setForm((current) => ({
        ...current,
        title: "",
        scheduledAt: "",
        meetingUrl: "",
        notes: "",
        interviewers: []
      }));

      await refreshInterviews();
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview scheduling</CardTitle>
        <CardDescription>
          Schedule loops against the candidate's live applications and notify the selected interviewers.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="application"
            value={form.application}
            onChange={(event) => {
              const nextApplication = applications.find(
                (item) => item._id === event.target.value
              );

              setForm((current) => ({
                ...current,
                application: event.target.value,
                job: nextApplication?.job?._id || ""
              }));
            }}
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          >
            <option value="">Select application</option>
            {applications.map((application) => (
              <option key={application._id} value={application._id}>
                {application.job?.title}
              </option>
            ))}
          </select>
          <input
            name="title"
            value={form.title}
            onChange={updateField}
            placeholder="Interview title"
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          />
          <select
            name="type"
            value={form.type}
            onChange={updateField}
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          >
            <option value="phone-screen">phone-screen</option>
            <option value="technical">technical</option>
            <option value="panel">panel</option>
            <option value="behavioral">behavioral</option>
            <option value="onsite">onsite</option>
          </select>
          <input
            name="scheduledAt"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={updateField}
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          />
          <input
            name="meetingUrl"
            value={form.meetingUrl}
            onChange={updateField}
            placeholder="Meeting URL"
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          />
          <input
            name="timezone"
            value={form.timezone}
            onChange={updateField}
            placeholder="Timezone"
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          />
        </div>
        <select
          multiple
          value={form.interviewers}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              interviewers: Array.from(
                event.target.selectedOptions,
                (option) => option.value
              )
            }))
          }
          className="min-h-28 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none"
        >
          {team.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.role})
            </option>
          ))}
        </select>
        <textarea
          name="notes"
          value={form.notes}
          onChange={updateField}
          placeholder="Interview notes"
          className="min-h-24 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={!form.application || !form.title || !form.scheduledAt || isScheduling}
          >
            <CalendarPlus2 className="mr-2 h-4 w-4" />
            {isScheduling ? "Scheduling..." : "Schedule interview"}
          </Button>
        </div>

        <div className="grid gap-3">
          {isLoading ? (
            <>
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-10" />
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-10" />
            </>
          ) : null}
          {interviews.map((interview) => (
            <div
              key={interview._id}
              className="rounded-[22px] border border-border/80 bg-secondary/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">{interview.title}</div>
                  <div className="text-sm text-muted-foreground">{interview.type}</div>
                </div>
                <div className="text-sm text-primary">
                  {formatDateTime(interview.scheduledAt)}
                </div>
              </div>
            </div>
          ))}
          {!interviews.length && !isLoading ? (
            <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
              No interviews scheduled yet.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default InterviewScheduler;
