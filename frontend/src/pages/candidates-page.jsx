import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContentSkeleton from "@/components/content-skeleton";
import EmptyState from "@/components/empty-state";
import ResumeUploadCard from "@/components/resume-upload-card";
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
  getCandidates,
  getJobs,
  rankCandidatesForJobRequest,
  semanticSearchCandidatesRequest,
} from "@/lib/hireai-api";
import { formatRelativeDate } from "@/lib/format";

function CandidatesPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchJobId, setSearchJobId] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [rankingResults, setRankingResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getJobs(token), getCandidates(token)])
      .then(([jobsResponse, candidatesResponse]) => {
        setJobs(jobsResponse.items);
        setCandidates(candidatesResponse.items);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    const hasSearchContext = Boolean(trimmedQuery || searchJobId);

    if (!hasSearchContext) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return undefined;
    }

    setSearchError("");
    setIsSearching(true);

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      semanticSearchCandidatesRequest(token, {
        query: trimmedQuery,
        jobId: searchJobId,
      })
        .then((response) => {
          if (!cancelled) {
            setSearchResults(response.items || []);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setSearchResults([]);
            setSearchError(error.message);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [token, searchQuery, searchJobId]);

  if (isLoading) {
    return <ContentSkeleton />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Candidate system"
        title="Resume parsing and candidate intake"
        description="Drag-and-drop resume upload now creates structured candidates with Gemini-backed parsing, and can push directly into a live role pipeline."
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              if (!searchJobId) {
                return;
              }
              setIsRanking(true);
              try {
                const response = await rankCandidatesForJobRequest(
                  token,
                  searchJobId,
                );
                setRankingResults(response.items);
              } finally {
                setIsRanking(false);
              }
            }}
            disabled={isRanking}
          >
            {isRanking ? "Ranking..." : "Rank for selected job"}
          </Button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <ResumeUploadCard
          jobs={jobs.filter((job) => job.status === "open")}
          onUploaded={(result) => {
            setUploadResult(result);
            getCandidates(token)
              .then((response) => setCandidates(response.items))
              .catch(console.error);
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Last parsed profile</CardTitle>
            <CardDescription>
              Review the latest structured output generated from an uploaded
              resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {uploadResult?.parsed ? (
              <>
                <div className="text-xl font-semibold text-foreground">
                  {uploadResult.parsed.fullName}
                </div>
                <p>{uploadResult.parsed.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {(uploadResult.parsed.skills || [])
                    .slice(0, 8)
                    .map((skill) => (
                      <Badge key={skill} tone="primary">
                        {skill}
                      </Badge>
                    ))}
                </div>
                <div className="rounded-[22px] border border-border/80 bg-secondary/45 px-4 py-4 text-sm text-muted-foreground">
                  Candidate record created successfully
                  {uploadResult.application
                    ? " and added to the selected job pipeline."
                    : "."}
                </div>
              </>
            ) : (
              <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">
                Parsed candidate data will appear here after upload.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Semantic search and AI ranking</CardTitle>
          <CardDescription>
            Use Gemini embeddings for semantic matching, then compare
            AI-assisted rank order for a selected role.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by meaning, not just keywords"
              className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
            />
            <select
              value={searchJobId}
              onChange={(event) => setSearchJobId(event.target.value)}
              className="h-12 rounded-2xl border border-border/80 bg-secondary/55 px-4 text-sm text-foreground outline-none"
            >
              <option value="">No job context</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
            <Button
              onClick={async () => {
                setIsSearching(true);
                try {
                  const response = await semanticSearchCandidatesRequest(
                    token,
                    {
                      query: searchQuery,
                      jobId: searchJobId,
                    },
                  );
                  setSearchResults(response.items);
                } finally {
                  setIsSearching(false);
                }
              }}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchResults.length ? (
            <div className="grid gap-3">
              {searchResults.map((result) => (
                <div
                  key={result.candidate._id}
                  className="rounded-[22px] border border-border/80 bg-secondary/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">
                        {result.candidate.firstName} {result.candidate.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.candidate.currentTitle || "Candidate profile"}
                      </div>
                    </div>
                    <div className="text-sm text-primary">
                      {(result.semanticScore * 100).toFixed(1)} semantic
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!searchResults.length && isSearching ? (
            <div className="grid gap-3">
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-4" />
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-4" />
            </div>
          ) : null}

          {searchError ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">
              {searchError}
            </div>
          ) : null}

          {!searchResults.length &&
          !isSearching &&
          (searchQuery.trim() || searchJobId) ? (
            <EmptyState
              title="No candidates matched"
              description="Try a broader term, clear the job context, or search by a stronger skill signal."
              actionLabel="Adjust search"
              onAction={() => {
                setSearchQuery("");
                setSearchJobId("");
              }}
            />
          ) : null}

          {rankingResults.length ? (
            <div className="grid gap-3">
              {rankingResults.slice(0, 10).map((result, index) => (
                <div
                  key={result.candidate._id}
                  className="rounded-[22px] border border-border/80 bg-secondary/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">
                        {index + 1}. {result.candidate.firstName}{" "}
                        {result.candidate.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        AI {result.aiScore.score} | Semantic{" "}
                        {(result.semanticScore * 100).toFixed(1)}
                      </div>
                    </div>
                    <div className="text-sm text-primary">
                      {result.combinedScore} combined
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Candidate directory</CardTitle>
          <CardDescription>
            Structured candidate records stored from direct creation and resume
            ingestion.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {candidates.map((candidate) => (
            <Link
              key={candidate._id}
              to={`/candidates/${candidate._id}`}
              className="rounded-[24px] border border-border/80 bg-secondary/40 px-5 py-4 transition hover:border-primary/35 hover:bg-secondary/60"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {candidate.firstName} {candidate.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {candidate.currentTitle || "Candidate profile"} |{" "}
                    {candidate.email}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="default">{candidate.source}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Added {formatRelativeDate(candidate.createdAt)}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    Open profile
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {!searchResults.length && isSearching ? (
            <div className="grid gap-3">
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-4" />
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-4" />
            </div>
          ) : null}

          {searchError ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-100">
              {searchError}
            </div>
          ) : null}

          {!searchResults.length &&
          !isSearching &&
          (searchQuery.trim() || searchJobId) ? (
            <EmptyState
              title="No candidates matched"
              description="Try a broader term, clear the job context, or search by a stronger skill signal."
              actionLabel="Adjust search"
              onAction={() => {
                setSearchQuery("");
                setSearchJobId("");
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidatesPage;
