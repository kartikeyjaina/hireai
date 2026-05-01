import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CommentsPanel from "@/components/comments-panel";
import InterviewScheduler from "@/components/interview-scheduler";
import SectionHeader from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getCandidateProfile } from "@/lib/hireai-api";
import { formatRelativeDate, stageLabel } from "@/lib/format";

function CandidateProfilePage() {
  const { token } = useAuth();
  const { candidateId } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getCandidateProfile(token, candidateId).then(setProfile).catch(console.error);
  }, [candidateId, token]);

  const candidate = profile?.candidate;
  const applications = profile?.applications || [];

  if (!candidate) {
    return <div className="text-sm text-muted-foreground">Loading candidate profile...</div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Candidate profile"
        title={`${candidate.firstName} ${candidate.lastName}`}
        description={candidate.summary || "Structured candidate profile created from resume parsing and recruiter inputs."}
        actions={
          <Link className="text-sm text-primary" to="/candidates">
            Back to candidates
          </Link>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Resume-derived identity, skills, and background signals.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-border/80 bg-secondary/40 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</div>
                <div className="mt-2 text-sm text-foreground">{candidate.email}</div>
              </div>
              <div className="rounded-[22px] border border-border/80 bg-secondary/40 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location</div>
                <div className="mt-2 text-sm text-foreground">{candidate.location || "Not provided"}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills || []).map((skill) => (
                <Badge key={skill} tone="primary">{skill}</Badge>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Added {formatRelativeDate(candidate.createdAt)} · {candidate.yearsExperience || 0} years experience
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application activity</CardTitle>
            <CardDescription>Roles this candidate is attached to and current stage placement.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {applications.map((application) => (
              <div key={application._id} className="rounded-[22px] border border-border/80 bg-secondary/40 p-4">
                <div className="text-sm font-semibold text-foreground">{application.job?.title}</div>
                <div className="mt-2 flex items-center gap-3">
                  <Badge tone="success">{stageLabel(application.stage)}</Badge>
                  <span className="text-sm text-muted-foreground">{application.score ?? "--"} fit</span>
                </div>
              </div>
            ))}
            {!applications.length ? (
              <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">
                This candidate has not been attached to a job yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CommentsPanel subjectId={candidate._id} subjectType="candidate" />
        <InterviewScheduler applications={applications} candidateId={candidate._id} />
      </section>
    </div>
  );
}

export default CandidateProfilePage;
