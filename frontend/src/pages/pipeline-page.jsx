import { useEffect, useState } from "react";
import ContentSkeleton from "@/components/content-skeleton";
import PipelineBoard from "@/components/pipeline-board";
import SectionHeader from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getJobs, getPipelineBoard, moveApplicationStage } from "@/lib/hireai-api";

function PipelinePage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [board, setBoard] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshBoard(jobId = selectedJobId) {
    const response = await getPipelineBoard(token, jobId);
    setBoard(response.board || {});
  }

  useEffect(() => {
    getJobs(token).then((response) => setJobs(response.items)).catch(console.error);
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    refreshBoard().catch(console.error).finally(() => setIsLoading(false));
  }, [token, selectedJobId]);

  if (isLoading) {
    return <ContentSkeleton cards={1} detail={false} />;
  }

  async function handleMove(dragging, nextStage) {
    const previousBoard = board;
    const movedItem = { ...dragging.item, stage: nextStage };
    const optimisticBoard = Object.fromEntries(
      Object.entries(previousBoard).map(([stage, items]) => [
        stage,
        stage === dragging.stage
          ? items.filter((item) => item._id !== dragging.id)
          : stage === nextStage
            ? [movedItem, ...items]
            : items
      ])
    );

    if (!optimisticBoard[nextStage]) {
      optimisticBoard[nextStage] = [movedItem];
    }

    setBoard(optimisticBoard);
    setIsSaving(true);

    try {
      await moveApplicationStage(token, dragging.id, {
        stage: nextStage,
        status: nextStage === "hired" ? "hired" : nextStage === "rejected" ? "rejected" : "active",
        notes: `Moved to ${nextStage}`
      });
      await refreshBoard();
    } catch (error) {
      console.error(error);
      setBoard(previousBoard);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Pipeline"
        title="Drag-and-drop hiring stages"
        description="Application stage changes persist to the backend, including stage history updates for every move."
        actions={
          <>
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
            <Button variant="secondary" onClick={() => refreshBoard()}>
              Refresh board
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Hiring workflow board</CardTitle>
          <CardDescription>
            Move applications between stages to persist pipeline progression for recruiters and hiring teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineBoard board={board} isSaving={isSaving} onMove={handleMove} />
        </CardContent>
      </Card>
    </div>
  );
}

export default PipelinePage;
