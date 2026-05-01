import validator from "validator";
import {
  APPLICATION_STAGES,
  APPLICATION_STATUSES,
  COMMENT_SUBJECT_TYPES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  JOB_STATUSES,
  NOTIFICATION_TYPES,
  USER_ROLES
} from "../utils/constants.js";
import {
  isNonEmptyString,
  normalizeArray,
  normalizeOptionalString,
  normalizeString
} from "../utils/validation.js";

function invalid(message, errors) {
  errors.push(message);
}

function createResult(errors, data) {
  return errors.length ? { success: false, errors } : { success: true, data };
}

export function validateUserUpdate(body) {
  const errors = [];
  const data = {};

  if (body.firstName !== undefined) {
    const firstName = normalizeString(body.firstName);
    if (!isNonEmptyString(firstName, 2)) invalid("First name must be at least 2 characters", errors);
    else data.firstName = firstName;
  }

  if (body.lastName !== undefined) {
    const lastName = normalizeString(body.lastName);
    if (!isNonEmptyString(lastName, 2)) invalid("Last name must be at least 2 characters", errors);
    else data.lastName = lastName;
  }

  if (body.role !== undefined) {
    const role = normalizeString(body.role).toLowerCase();
    if (!USER_ROLES.includes(role)) invalid("Role is invalid", errors);
    else data.role = role;
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  return createResult(errors, data);
}

export function validateJob(body, options = {}) {
  const { partial = false } = options;
  const errors = [];
  const status = body.status !== undefined ? normalizeString(body.status).toLowerCase() : undefined;
  const employmentType =
    body.employmentType !== undefined
      ? normalizeString(body.employmentType).toLowerCase()
      : undefined;
  const experienceLevel =
    body.experienceLevel !== undefined
      ? normalizeString(body.experienceLevel).toLowerCase()
      : undefined;
  const salaryMin = body.salaryMin === undefined ? undefined : Number(body.salaryMin);
  const salaryMax = body.salaryMax === undefined ? undefined : Number(body.salaryMax);

  if ((!partial || body.title !== undefined) && !isNonEmptyString(body.title, 2)) invalid("Job title is required", errors);
  if ((!partial || body.department !== undefined) && !isNonEmptyString(body.department, 2)) invalid("Department is required", errors);
  if ((!partial || body.location !== undefined) && !isNonEmptyString(body.location, 2)) invalid("Location is required", errors);
  if ((!partial || body.status !== undefined) && !JOB_STATUSES.includes(status)) invalid("Job status is invalid", errors);
  if ((!partial || body.employmentType !== undefined) && !EMPLOYMENT_TYPES.includes(employmentType)) invalid("Employment type is invalid", errors);
  if ((!partial || body.experienceLevel !== undefined) && !EXPERIENCE_LEVELS.includes(experienceLevel)) invalid("Experience level is invalid", errors);
  if ((!partial || body.description !== undefined) && !isNonEmptyString(body.description, 20)) invalid("Description must be at least 20 characters", errors);
  if (salaryMin !== undefined && Number.isNaN(salaryMin)) invalid("salaryMin must be a number", errors);
  if (salaryMax !== undefined && Number.isNaN(salaryMax)) invalid("salaryMax must be a number", errors);
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
    invalid("salaryMin cannot be greater than salaryMax", errors);
  }

  const data = {};

  if (body.title !== undefined) data.title = normalizeString(body.title);
  if (body.department !== undefined) data.department = normalizeString(body.department);
  if (body.location !== undefined) data.location = normalizeString(body.location);
  if (body.employmentType !== undefined) data.employmentType = employmentType;
  if (body.experienceLevel !== undefined) data.experienceLevel = experienceLevel;
  if (body.status !== undefined) data.status = status;
  if (body.description !== undefined) data.description = normalizeString(body.description);
  if (body.requirements !== undefined) data.requirements = normalizeArray(body.requirements);
  if (body.responsibilities !== undefined) data.responsibilities = normalizeArray(body.responsibilities);
  if (body.skills !== undefined) data.skills = normalizeArray(body.skills);
  if (body.pipelineStages !== undefined) data.pipelineStages = normalizeArray(body.pipelineStages);
  if (body.salaryMin !== undefined) data.salaryMin = salaryMin;
  if (body.salaryMax !== undefined) data.salaryMax = salaryMax;
  if (body.currency !== undefined) data.currency = normalizeOptionalString(body.currency) || "USD";
  if (body.closesAt !== undefined) data.closesAt = body.closesAt ? new Date(body.closesAt) : null;
  if (body.hiringManager !== undefined) data.hiringManager = normalizeOptionalString(body.hiringManager) || null;

  return createResult(errors, data);
}

export function validateCandidate(body, options = {}) {
  const { partial = false } = options;
  const errors = [];
  const email = body.email !== undefined ? normalizeString(body.email).toLowerCase() : undefined;
  const yearsExperience =
    body.yearsExperience === undefined ? undefined : Number(body.yearsExperience);

  if ((!partial || body.firstName !== undefined) && !isNonEmptyString(body.firstName, 2)) invalid("First name is required", errors);
  if ((!partial || body.lastName !== undefined) && !isNonEmptyString(body.lastName, 2)) invalid("Last name is required", errors);
  if ((!partial || body.email !== undefined) && !validator.isEmail(email || "")) invalid("Candidate email is invalid", errors);
  if (yearsExperience !== undefined && (Number.isNaN(yearsExperience) || yearsExperience < 0)) {
    invalid("yearsExperience must be a non-negative number", errors);
  }

  const data = {};

  if (body.firstName !== undefined) data.firstName = normalizeString(body.firstName);
  if (body.lastName !== undefined) data.lastName = normalizeString(body.lastName);
  if (body.email !== undefined) data.email = email;
  if (body.phone !== undefined) data.phone = normalizeOptionalString(body.phone);
  if (body.location !== undefined) data.location = normalizeOptionalString(body.location);
  if (body.currentTitle !== undefined) data.currentTitle = normalizeOptionalString(body.currentTitle);
  if (body.yearsExperience !== undefined) data.yearsExperience = yearsExperience;
  if (body.source !== undefined) data.source = normalizeOptionalString(body.source) || "manual";
  if (body.summary !== undefined) data.summary = normalizeOptionalString(body.summary);
  if (body.skills !== undefined) data.skills = normalizeArray(body.skills);
  if (body.tags !== undefined) data.tags = normalizeArray(body.tags);
  if (body.resumeUrl !== undefined) data.resumeUrl = normalizeOptionalString(body.resumeUrl);
  if (body.parsedResumeText !== undefined) data.parsedResumeText = normalizeOptionalString(body.parsedResumeText);

  return createResult(errors, data);
}

export function validateApplication(body, options = {}) {
  const { partial = false } = options;
  const errors = [];
  const stage = body.stage !== undefined ? normalizeString(body.stage).toLowerCase() : undefined;
  const status = body.status !== undefined ? normalizeString(body.status).toLowerCase() : undefined;
  const score = body.score === undefined || body.score === null ? null : Number(body.score);

  if ((!partial || body.candidate !== undefined) && !isNonEmptyString(body.candidate, 1)) invalid("candidate is required", errors);
  if ((!partial || body.job !== undefined) && !isNonEmptyString(body.job, 1)) invalid("job is required", errors);
  if ((!partial || body.stage !== undefined) && !APPLICATION_STAGES.includes(stage)) invalid("Application stage is invalid", errors);
  if ((!partial || body.status !== undefined) && !APPLICATION_STATUSES.includes(status)) invalid("Application status is invalid", errors);
  if (score !== null && (Number.isNaN(score) || score < 0 || score > 100)) {
    invalid("score must be between 0 and 100", errors);
  }

  const data = {};

  if (body.candidate !== undefined) data.candidate = normalizeString(body.candidate);
  if (body.job !== undefined) data.job = normalizeString(body.job);
  if (body.stage !== undefined) data.stage = stage;
  if (body.status !== undefined) data.status = status;
  if (body.score !== undefined) data.score = score;
  if (body.appliedAt !== undefined) data.appliedAt = body.appliedAt ? new Date(body.appliedAt) : new Date();
  if (body.owner !== undefined) data.owner = normalizeOptionalString(body.owner) || null;
  if (body.source !== undefined) data.source = normalizeOptionalString(body.source) || "direct";
  if (body.notes !== undefined) data.notes = normalizeOptionalString(body.notes);

  return createResult(errors, data);
}

export function validateInterview(body, options = {}) {
  const { partial = false } = options;
  const errors = [];
  const type = body.type !== undefined ? normalizeString(body.type).toLowerCase() : undefined;
  const status = body.status !== undefined ? normalizeString(body.status).toLowerCase() : undefined;
  const durationMinutes =
    body.durationMinutes === undefined ? undefined : Number(body.durationMinutes);

  if ((!partial || body.application !== undefined) && !isNonEmptyString(body.application, 1)) invalid("application is required", errors);
  if ((!partial || body.job !== undefined) && !isNonEmptyString(body.job, 1)) invalid("job is required", errors);
  if ((!partial || body.candidate !== undefined) && !isNonEmptyString(body.candidate, 1)) invalid("candidate is required", errors);
  if ((!partial || body.title !== undefined) && !isNonEmptyString(body.title, 2)) invalid("Interview title is required", errors);
  if ((!partial || body.type !== undefined) && !INTERVIEW_TYPES.includes(type)) invalid("Interview type is invalid", errors);
  if ((!partial || body.status !== undefined) && !INTERVIEW_STATUSES.includes(status)) invalid("Interview status is invalid", errors);
  if ((!partial || body.scheduledAt !== undefined) && (!body.scheduledAt || Number.isNaN(new Date(body.scheduledAt).getTime()))) {
    invalid("scheduledAt must be a valid date", errors);
  }
  if ((!partial || body.timezone !== undefined) && !isNonEmptyString(body.timezone, 2)) invalid("timezone is required", errors);
  if (durationMinutes !== undefined && (Number.isNaN(durationMinutes) || durationMinutes < 15)) {
    invalid("durationMinutes must be at least 15", errors);
  }

  const data = {};

  if (body.application !== undefined) data.application = normalizeString(body.application);
  if (body.job !== undefined) data.job = normalizeString(body.job);
  if (body.candidate !== undefined) data.candidate = normalizeString(body.candidate);
  if (body.title !== undefined) data.title = normalizeString(body.title);
  if (body.type !== undefined) data.type = type;
  if (body.status !== undefined) data.status = status;
  if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt);
  if (body.durationMinutes !== undefined) data.durationMinutes = durationMinutes;
  if (body.timezone !== undefined) data.timezone = normalizeString(body.timezone);
  if (body.meetingUrl !== undefined) data.meetingUrl = normalizeOptionalString(body.meetingUrl);
  if (body.notes !== undefined) data.notes = normalizeOptionalString(body.notes);
  if (body.interviewers !== undefined) data.interviewers = normalizeArray(body.interviewers);

  return createResult(errors, data);
}

export function validateComment(body, options = {}) {
  const { partial = false } = options;
  const errors = [];
  const subjectType =
    body.subjectType !== undefined ? normalizeString(body.subjectType).toLowerCase() : undefined;

  if ((!partial || body.subjectType !== undefined) && !COMMENT_SUBJECT_TYPES.includes(subjectType)) invalid("subjectType is invalid", errors);
  if ((!partial || body.subjectId !== undefined) && !isNonEmptyString(body.subjectId, 1)) invalid("subjectId is required", errors);
  if ((!partial || body.body !== undefined) && !isNonEmptyString(body.body, 2)) invalid("Comment body is required", errors);

  const data = {};

  if (body.subjectType !== undefined) data.subjectType = subjectType;
  if (body.subjectId !== undefined) data.subjectId = normalizeString(body.subjectId);
  if (body.body !== undefined) data.body = normalizeString(body.body);
  if (body.mentions !== undefined) data.mentions = normalizeArray(body.mentions);

  return createResult(errors, data);
}

export function validateNotification(body) {
  const errors = [];
  const type = normalizeString(body.type).toLowerCase();

  if (!isNonEmptyString(body.recipient, 1)) invalid("recipient is required", errors);
  if (!NOTIFICATION_TYPES.includes(type)) invalid("Notification type is invalid", errors);
  if (!isNonEmptyString(body.title, 2)) invalid("Notification title is required", errors);
  if (!isNonEmptyString(body.message, 2)) invalid("Notification message is required", errors);

  return createResult(errors, {
    recipient: normalizeString(body.recipient),
    type,
    title: normalizeString(body.title),
    message: normalizeString(body.message),
    link: normalizeOptionalString(body.link),
    metadata:
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {}
  });
}

export function validatePublicApplication(body) {
  const errors = [];
  const firstName = normalizeString(body.firstName);
  const lastName = normalizeString(body.lastName);
  const email = normalizeString(body.email).toLowerCase();
  const phone = normalizeOptionalString(body.phone);
  const jobId = normalizeString(body.jobId);

  if (!isNonEmptyString(jobId, 1)) invalid("jobId is required", errors);
  if (!isNonEmptyString(firstName, 2)) invalid("First name must be at least 2 characters", errors);
  if (!isNonEmptyString(lastName, 2)) invalid("Last name must be at least 2 characters", errors);
  if (!validator.isEmail(email || "")) invalid("Enter a valid email address", errors);

  return createResult(errors, {
    jobId,
    firstName,
    lastName,
    email,
    phone
  });
}
