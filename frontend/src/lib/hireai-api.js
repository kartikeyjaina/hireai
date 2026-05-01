import { apiRequest } from "@/lib/api";

function authHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...extra
  };
}

export function getOverview(token) {
  return Promise.all([
    apiRequest("/jobs?limit=100", { headers: authHeaders(token) }),
    apiRequest("/candidates?limit=100", { headers: authHeaders(token) }),
    apiRequest("/applications?limit=100", { headers: authHeaders(token) })
  ]).then(([jobs, candidates, applications]) => ({
    jobs,
    candidates,
    applications
  }));
}

export function getJobs(token) {
  return apiRequest("/jobs?limit=100", {
    headers: authHeaders(token)
  });
}

export function createJob(token, payload) {
  return apiRequest("/jobs", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function updateJob(token, jobId, payload) {
  return apiRequest(`/jobs/${jobId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function generateJobDescriptionRequest(token, payload) {
  return apiRequest("/jobs/generate-description", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function getCandidates(token, search = "") {
  const query = search ? `?limit=100&search=${encodeURIComponent(search)}` : "?limit=100";
  return apiRequest(`/candidates${query}`, {
    headers: authHeaders(token)
  });
}

export function semanticSearchCandidatesRequest(token, { query = "", jobId = "" }) {
  const params = new URLSearchParams();

  if (query) {
    params.set("query", query);
  }

  if (jobId) {
    params.set("jobId", jobId);
  }

  return apiRequest(`/candidates/semantic-search/query?${params.toString()}`, {
    headers: authHeaders(token)
  });
}

export function rankCandidatesForJobRequest(token, jobId) {
  return apiRequest(`/candidates/ranking/job/${jobId}`, {
    headers: authHeaders(token)
  });
}

export function uploadResumeRequest(token, formData) {
  return apiRequest("/candidates/upload-resume", {
    method: "POST",
    headers: authHeaders(token),
    body: formData
  });
}

export function getCandidateProfile(token, candidateId) {
  return apiRequest(`/candidates/${candidateId}/profile`, {
    headers: authHeaders(token)
  });
}

export function getUserDirectory(token, search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest(`/users/directory${query}`, {
    headers: authHeaders(token)
  });
}

export function getComments(token, { subjectType, subjectId }) {
  const params = new URLSearchParams({
    subjectType,
    subjectId
  });

  return apiRequest(`/comments?${params.toString()}`, {
    headers: authHeaders(token)
  });
}

export function createCommentRequest(token, payload) {
  return apiRequest("/comments", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function getInterviews(token, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return apiRequest(`/interviews${suffix}`, {
    headers: authHeaders(token)
  });
}

export function createInterviewRequest(token, payload) {
  return apiRequest("/interviews", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function updateInterviewRequest(token, interviewId, payload) {
  return apiRequest(`/interviews/${interviewId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function getNotifications(token, unreadOnly = false) {
  const query = unreadOnly ? "?unreadOnly=true" : "";
  return apiRequest(`/notifications${query}`, {
    headers: authHeaders(token)
  });
}

export function markNotificationReadRequest(token, notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
}

export function markAllNotificationsReadRequest(token) {
  return apiRequest("/notifications/read-all", {
    method: "PATCH",
    headers: authHeaders(token)
  });
}

export function getHiringAnalyticsRequest(token, jobId = "") {
  const query = jobId ? `?jobId=${encodeURIComponent(jobId)}` : "";
  return apiRequest(`/analytics/hiring${query}`, {
    headers: authHeaders(token)
  });
}

export function getPipelineBoard(token, jobId = "") {
  const query = jobId ? `?jobId=${encodeURIComponent(jobId)}` : "";
  return apiRequest(`/applications/pipeline/board${query}`, {
    headers: authHeaders(token)
  });
}

export function moveApplicationStage(token, applicationId, payload) {
  return apiRequest(`/applications/${applicationId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}
