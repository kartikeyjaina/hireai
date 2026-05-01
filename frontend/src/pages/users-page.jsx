import { useEffect, useState } from "react";
import ContentSkeleton from "@/components/content-skeleton";
import EmptyState from "@/components/empty-state";
import SectionHeader from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { deactivateUserRequest, getUsersRequest, updateUserRequest } from "@/lib/hireai-api";

const roles = ["admin", "recruiter", "interviewer"];

function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingId, setIsSavingId] = useState("");

  async function refresh() {
    const response = await getUsersRequest(token);
    setUsers(response.items || []);
  }

  useEffect(() => {
    setIsLoading(true);
    refresh().catch(console.error).finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return <ContentSkeleton cards={1} detail={false} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Admin"
        title="User administration"
        description="Manage active users and role assignments across admins, recruiters, and interviewers."
        actions={
          <Button variant="secondary" onClick={() => refresh().catch(console.error)}>
            Refresh users
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace users</CardTitle>
          <CardDescription>
            Update role permissions or deactivate inactive accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-[24px] border border-border/80 bg-secondary/40 px-5 py-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-base font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone={user.isActive ? "success" : "default"}>
                      {user.isActive ? "active" : "inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={user.role}
                    className="h-10 rounded-xl border border-border/80 bg-secondary/60 px-3 text-sm"
                    onChange={async (event) => {
                      const nextRole = event.target.value;
                      const previousUsers = users;
                      setUsers((current) =>
                        current.map((item) =>
                          item.id === user.id ? { ...item, role: nextRole } : item
                        )
                      );
                      setIsSavingId(user.id);
                      try {
                        await updateUserRequest(token, user.id, { role: nextRole });
                        await refresh();
                      } catch (error) {
                        console.error(error);
                        setUsers(previousUsers);
                      } finally {
                        setIsSavingId("");
                      }
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!user.isActive || isSavingId === user.id}
                    onClick={async () => {
                      const previousUsers = users;
                      setUsers((current) =>
                        current.map((item) =>
                          item.id === user.id ? { ...item, isActive: false } : item
                        )
                      );
                      setIsSavingId(user.id);
                      try {
                        await deactivateUserRequest(token, user.id);
                        await refresh();
                      } catch (error) {
                        console.error(error);
                        setUsers(previousUsers);
                      } finally {
                        setIsSavingId("");
                      }
                    }}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!users.length ? (
            <EmptyState
              title="No users found"
              description="Users will appear here after signup."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default UsersPage;
