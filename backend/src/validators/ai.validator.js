import {
  normalizeArray,
  normalizeOptionalString,
  normalizeString
} from "../utils/validation.js";

function result(errors, data) {
  return errors.length ? { success: false, errors } : { success: true, data };
}

export function validateCandidateScoreRequest(body) {
  const errors = [];

  if (!body.candidateProfile || typeof body.candidateProfile !== "object") {
    errors.push("candidateProfile is required");
  }

  if (!normalizeString(body.jobTitle)) {
    errors.push("jobTitle is required");
  }

  if (normalizeString(body.jobDescription).length < 20) {
    errors.push("jobDescription must be at least 20 characters");
  }

  return result(errors, {
    candidateProfile: body.candidateProfile,
    jobTitle: normalizeString(body.jobTitle),
    jobDescription: normalizeString(body.jobDescription),
    mustHaveSkills: normalizeArray(body.mustHaveSkills)
  });
}

export function validateInterviewQuestionRequest(body) {
  const errors = [];

  if (!normalizeString(body.jobTitle)) {
    errors.push("jobTitle is required");
  }

  if (normalizeString(body.jobDescription).length < 20) {
    errors.push("jobDescription must be at least 20 characters");
  }

  if (!normalizeString(body.interviewStage)) {
    errors.push("interviewStage is required");
  }

  return result(errors, {
    candidateProfile:
      body.candidateProfile && typeof body.candidateProfile === "object"
        ? body.candidateProfile
        : {},
    jobTitle: normalizeString(body.jobTitle),
    jobDescription: normalizeString(body.jobDescription),
    interviewStage: normalizeString(body.interviewStage),
    questionCount: Number(body.questionCount) || 6
  });
}

export function validateJobDescriptionRequest(body) {
  const errors = [];

  if (!normalizeString(body.title)) errors.push("title is required");
  if (!normalizeString(body.department)) errors.push("department is required");
  if (!normalizeString(body.location)) errors.push("location is required");
  if (!normalizeString(body.employmentType)) errors.push("employmentType is required");
  if (!normalizeString(body.experienceLevel)) errors.push("experienceLevel is required");
  if (normalizeString(body.companyOverview).length < 20) {
    errors.push("companyOverview must be at least 20 characters");
  }

  const goals = normalizeArray(body.goals);

  if (!goals.length) {
    errors.push("goals must contain at least one item");
  }

  return result(errors, {
    title: normalizeString(body.title),
    department: normalizeString(body.department),
    location: normalizeString(body.location),
    employmentType: normalizeString(body.employmentType),
    experienceLevel: normalizeString(body.experienceLevel),
    companyOverview: normalizeString(body.companyOverview),
    goals,
    requiredSkills: normalizeArray(body.requiredSkills),
    preferredSkills: normalizeArray(body.preferredSkills),
    tone: normalizeOptionalString(body.tone)
  });
}
