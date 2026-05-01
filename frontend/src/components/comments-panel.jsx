import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { createCommentRequest, getComments, getUserDirectory } from "@/lib/hireai-api";
import { formatRelativeDate } from "@/lib/format";

function CommentsPanel({ subjectId, subjectType }) {
  const { token } = useAuth();
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshComments() {
    const response = await getComments(token, {
      subjectType,
      subjectId
    });
    setComments(response.items);
  }

  useEffect(() => {
    getUserDirectory(token).then((response) => setUsers(response.items)).catch(console.error);
    setIsLoading(true);
    refreshComments().catch(console.error).finally(() => setIsLoading(false));
  }, [subjectId, subjectType, token]);

  async function handleSubmit() {
    if (!body.trim()) {
      return;
    }

    setIsSaving(true);
    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      author: {
        firstName: "You",
        lastName: "",
        id: "self"
      },
      mentions: users.filter((user) => mentions.includes(user.id))
    };
    const previousComments = comments;
    setComments((current) => [optimisticComment, ...current]);

    try {
      await createCommentRequest(token, {
        subjectType,
        subjectId,
        body,
        mentions
      });
      setBody("");
      setMentions([]);
      await refreshComments();
    } catch (error) {
      console.error(error);
      setComments(previousComments);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaboration</CardTitle>
        <CardDescription>
          Leave candidate notes, tag teammates, and keep hiring feedback attached to the record.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add context for the hiring team..."
          className="min-h-28 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none"
        />
        <select
          multiple
          value={mentions}
          onChange={(event) =>
            setMentions(Array.from(event.target.selectedOptions, (option) => option.value))
          }
          className="min-h-28 rounded-3xl border border-border/80 bg-secondary/55 px-4 py-3 text-sm text-foreground outline-none"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.role})
            </option>
          ))}
        </select>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSaving}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Post comment"}
          </Button>
        </div>

        <div className="grid gap-3">
          {isLoading ? (
            <>
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-10" />
              <div className="animate-pulse rounded-[22px] border border-border/80 bg-secondary/40 p-10" />
            </>
          ) : null}
          {comments.map((comment) => (
            <div key={comment._id} className="rounded-[22px] border border-border/80 bg-secondary/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">
                  {comment.author?.firstName} {comment.author?.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatRelativeDate(comment.createdAt)}
                </div>
              </div>
              <p className="mt-3">{comment.body}</p>
              {comment.mentions?.length ? (
                <div className="mt-3 text-xs text-primary">
                  Mentioned:{" "}
                  {comment.mentions
                    .map((user) => `${user.firstName} ${user.lastName}`)
                    .join(", ")}
                </div>
              ) : null}
            </div>
          ))}
          {!comments.length && !isLoading ? (
            <div className="rounded-[22px] border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
              No comments yet. Add the first collaboration note.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default CommentsPanel;
