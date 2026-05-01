import { useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadResumeRequest } from "@/lib/hireai-api";
import { useAuth } from "@/context/auth-context";

function ResumeUploadCard({ jobs, onUploaded }) {
  const { token } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [jobId, setJobId] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const selectedJob = useMemo(
    () => jobs.find((item) => item._id === jobId) || null,
    [jobId, jobs]
  );

  function selectFile(nextFile) {
    setFile(nextFile || null);
    setError("");
  }

  async function handleUpload() {
    if (!file) {
      setError("Choose a resume file to continue");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("targetRole", targetRole);

    if (selectedJob) {
      formData.append("jobId", selectedJob._id);
      formData.append("companyContext", `${selectedJob.department} hiring for ${selectedJob.title}`);
    }

    setIsUploading(true);
    setError("");

    try {
      const response = await uploadResumeRequest(token, formData);
      onUploaded(response);
      setFile(null);
      setTargetRole("");
      setJobId("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume intake</CardTitle>
        <CardDescription>
          Drag in a PDF, DOCX, or TXT resume. HireAI parses the profile with Gemini and can attach it to a live role.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            selectFile(event.dataTransfer.files?.[0]);
          }}
          className={`rounded-[28px] border border-dashed px-6 py-10 text-center transition ${
            dragActive
              ? "border-primary/60 bg-primary/10"
              : "border-border/80 bg-secondary/35"
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold text-foreground">
            {file ? file.name : "Drop a resume here"}
          </div>
          <p className="mt-2 text-sm">or select a file from disk for AI parsing and structured candidate creation.</p>
          <label className="mt-5 inline-flex cursor-pointer items-center rounded-full border border-border/80 bg-secondary/65 px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary/35">
            Choose file
            <input
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="Target role for better parsing context"
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          />
          <select
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
          >
            <option value="">No linked job</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
        {error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        <div className="flex justify-end">
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Parsing resume..." : "Parse and create candidate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ResumeUploadCard;
