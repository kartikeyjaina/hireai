import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { getRedisClient } from "../config/redis.js";
import AppError from "../utils/app-error.js";

const CACHE_TTL_SECONDS = 60 * 60 * 6;
const EMBEDDING_MODEL = "gemini-embedding-001";

const resumeSchema = {
  type: "object",
  properties: {
    fullName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    location: { type: "string" },
    currentTitle: { type: "string" },
    summary: { type: "string" },
    totalYearsExperience: { type: "number" },
    skills: {
      type: "array",
      items: { type: "string" }
    },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          achievements: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["company", "title", "achievements"]
      }
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          fieldOfStudy: { type: "string" },
          graduationYear: { type: "string" }
        },
        required: ["institution"]
      }
    },
    certifications: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "fullName",
    "email",
    "phone",
    "location",
    "currentTitle",
    "summary",
    "totalYearsExperience",
    "skills",
    "workExperience",
    "education",
    "certifications"
  ]
};

const candidateScoreSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    recommendation: {
      type: "string",
      enum: ["strong_yes", "yes", "mixed", "no"]
    },
    strengths: {
      type: "array",
      items: { type: "string" }
    },
    concerns: {
      type: "array",
      items: { type: "string" }
    },
    summary: { type: "string" }
  },
  required: ["score", "recommendation", "strengths", "concerns", "summary"]
};

const interviewQuestionsSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          question: { type: "string" },
          rationale: { type: "string" }
        },
        required: ["category", "question", "rationale"]
      }
    }
  },
  required: ["questions"]
};

const emailSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
    tone: { type: "string" }
  },
  required: ["subject", "body", "tone"]
};

const jobDescriptionSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    responsibilities: {
      type: "array",
      items: { type: "string" }
    },
    requirements: {
      type: "array",
      items: { type: "string" }
    },
    preferredQualifications: {
      type: "array",
      items: { type: "string" }
    },
    skills: {
      type: "array",
      items: { type: "string" }
    },
    closingPitch: { type: "string" }
  },
  required: [
    "title",
    "summary",
    "responsibilities",
    "requirements",
    "preferredQualifications",
    "skills",
    "closingPitch"
  ]
};

function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError("GEMINI_API_KEY is not configured", 500);
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
}

function getModelName() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function createCacheKey(taskName, payload) {
  const modelName = getModelName();
  const hash = crypto
    .createHash("sha256")
    .update(stableSerialize(payload))
    .digest("hex");

  return `hireai:ai:${taskName}:${modelName}:${hash}`;
}

async function getCachedValue(cacheKey) {
  try {
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("AI cache read failed", error);
    return null;
  }
}

async function setCachedValue(cacheKey, value, ttlSeconds = CACHE_TTL_SECONDS) {
  try {
    const redis = getRedisClient();
    await redis.set(cacheKey, JSON.stringify(value), {
      EX: ttlSeconds
    });
  } catch (error) {
    console.error("AI cache write failed", error);
  }
}

function buildGenerationConfig(schema) {
  return {
    temperature: 0.2,
    responseMimeType: "application/json",
    responseJsonSchema: schema
  };
}

function normalizeEmbeddingResponse(response) {
  if (Array.isArray(response?.embeddings) && response.embeddings[0]?.values) {
    return response.embeddings[0].values;
  }

  if (response?.embedding?.values) {
    return response.embedding.values;
  }

  throw new AppError("Gemini returned an invalid embedding response", 502);
}

export function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB) || !vectorA.length || !vectorB.length) {
    return 0;
  }

  const length = Math.min(vectorA.length, vectorB.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < length; index += 1) {
    const a = Number(vectorA[index]) || 0;
    const b = Number(vectorB[index]) || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateStructuredOutput({
  taskName,
  prompt,
  schema,
  cachePayload,
  ttlSeconds = CACHE_TTL_SECONDS
}) {
  const cacheKey = createCacheKey(taskName, cachePayload);
  const cached = await getCachedValue(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: buildGenerationConfig(schema)
    });

    if (!response?.text) {
      throw new AppError(`Gemini returned an empty response for ${taskName}`, 502);
    }

    const parsed = JSON.parse(response.text);
    await setCachedValue(cacheKey, parsed, ttlSeconds);
    return parsed;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error(`Gemini request failed for ${taskName}`, error);
    throw new AppError(`Gemini request failed for ${taskName}`, 502, [
      error.message
    ]);
  }
}

function requireString(value, fieldName, minLength = 1) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw new AppError(`${fieldName} is required`, 422);
  }

  return value.trim();
}

function requireArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(`${fieldName} must be a non-empty array`, 422);
  }

  return value;
}

export async function parseResume({
  resumeText,
  targetRole = "",
  companyContext = ""
}) {
  const normalizedResumeText = requireString(resumeText, "resumeText", 50);

  const prompt = `
You are an expert recruiting operations analyst.
Extract structured candidate data from the resume below.

Rules:
- Return valid JSON only.
- Do not invent employers, dates, certifications, or degrees.
- If information is missing, return an empty string, empty array, or 0 where appropriate.
- Normalize skills into concise skill names.
- Summarize the candidate professionally in 2-4 sentences.
- Focus on relevance for the target role if provided.

Target role: ${targetRole || "Not provided"}
Company context: ${companyContext || "Not provided"}

Resume:
${normalizedResumeText}
`.trim();

  return generateStructuredOutput({
    taskName: "parseResume",
    prompt,
    schema: resumeSchema,
    cachePayload: { resumeText: normalizedResumeText, targetRole, companyContext }
  });
}

export async function scoreCandidate({
  candidateProfile,
  jobTitle,
  jobDescription,
  mustHaveSkills = []
}) {
  if (!candidateProfile || typeof candidateProfile !== "object") {
    throw new AppError("candidateProfile is required", 422);
  }

  const normalizedJobTitle = requireString(jobTitle, "jobTitle", 2);
  const normalizedJobDescription = requireString(
    jobDescription,
    "jobDescription",
    20
  );

  const prompt = `
You are a senior recruiting evaluator.
Assess the candidate against the role and return a rigorous hiring recommendation.

Rules:
- Return valid JSON only.
- Score from 0 to 100.
- Base the score on evidence from the candidate profile and the job requirements.
- Use recommendation values: strong_yes, yes, mixed, no.
- Strengths and concerns must each be concrete and role-specific.
- Summary must explain the overall evaluation in 3-5 sentences.

Role title: ${normalizedJobTitle}
Must-have skills: ${mustHaveSkills.join(", ") || "Not provided"}

Job description:
${normalizedJobDescription}

Candidate profile:
${JSON.stringify(candidateProfile, null, 2)}
`.trim();

  return generateStructuredOutput({
    taskName: "scoreCandidate",
    prompt,
    schema: candidateScoreSchema,
    cachePayload: {
      candidateProfile,
      jobTitle: normalizedJobTitle,
      jobDescription: normalizedJobDescription,
      mustHaveSkills
    }
  });
}

export async function generateInterviewQuestions({
  candidateProfile,
  jobTitle,
  jobDescription,
  interviewStage,
  questionCount = 6
}) {
  const normalizedJobTitle = requireString(jobTitle, "jobTitle", 2);
  const normalizedJobDescription = requireString(
    jobDescription,
    "jobDescription",
    20
  );
  const normalizedStage = requireString(interviewStage, "interviewStage", 2);
  const safeQuestionCount = Math.min(Math.max(Number(questionCount) || 6, 3), 12);

  const prompt = `
You are designing structured interview questions for a hiring team.
Generate ${safeQuestionCount} questions for this interview stage.

Rules:
- Return valid JSON only.
- Questions must be specific to the role and candidate context.
- Balance technical, behavioral, and role-specific evaluation where appropriate.
- Each item must include a short rationale explaining what the interviewer is testing.

Role title: ${normalizedJobTitle}
Interview stage: ${normalizedStage}

Job description:
${normalizedJobDescription}

Candidate profile:
${JSON.stringify(candidateProfile || {}, null, 2)}
`.trim();

  return generateStructuredOutput({
    taskName: "generateInterviewQuestions",
    prompt,
    schema: interviewQuestionsSchema,
    cachePayload: {
      candidateProfile,
      jobTitle: normalizedJobTitle,
      jobDescription: normalizedJobDescription,
      interviewStage: normalizedStage,
      questionCount: safeQuestionCount
    }
  });
}

export async function generateEmail({
  emailType,
  recipientName,
  companyName,
  jobTitle,
  context,
  tone = "professional and warm"
}) {
  const normalizedEmailType = requireString(emailType, "emailType", 2);
  const normalizedRecipientName = requireString(recipientName, "recipientName", 2);
  const normalizedCompanyName = requireString(companyName, "companyName", 2);
  const normalizedJobTitle = requireString(jobTitle, "jobTitle", 2);
  const normalizedContext = requireString(context, "context", 10);

  const prompt = `
You are a recruiting operations specialist writing candidate-facing hiring emails.
Draft a polished email for the scenario below.

Rules:
- Return valid JSON only.
- Keep the tone ${tone}.
- Write a subject line and email body that are ready to send.
- Use clear paragraphs, plain text only, and no placeholders.
- The content must reflect the exact context provided.

Email type: ${normalizedEmailType}
Recipient name: ${normalizedRecipientName}
Company name: ${normalizedCompanyName}
Job title: ${normalizedJobTitle}
Context:
${normalizedContext}
`.trim();

  return generateStructuredOutput({
    taskName: "generateEmail",
    prompt,
    schema: emailSchema,
    cachePayload: {
      emailType: normalizedEmailType,
      recipientName: normalizedRecipientName,
      companyName: normalizedCompanyName,
      jobTitle: normalizedJobTitle,
      context: normalizedContext,
      tone
    }
  });
}

export async function generateJobDescription({
  title,
  department,
  location,
  employmentType,
  experienceLevel,
  companyOverview,
  goals,
  requiredSkills = [],
  preferredSkills = []
}) {
  const normalizedTitle = requireString(title, "title", 2);
  const normalizedDepartment = requireString(department, "department", 2);
  const normalizedLocation = requireString(location, "location", 2);
  const normalizedEmploymentType = requireString(
    employmentType,
    "employmentType",
    2
  );
  const normalizedExperienceLevel = requireString(
    experienceLevel,
    "experienceLevel",
    2
  );
  const normalizedCompanyOverview = requireString(
    companyOverview,
    "companyOverview",
    20
  );
  const normalizedGoals = requireArray(goals, "goals")
    .map((goal) => String(goal).trim())
    .filter(Boolean);
  const normalizedRequiredSkills = Array.isArray(requiredSkills)
    ? requiredSkills.map((skill) => String(skill).trim()).filter(Boolean)
    : [];
  const normalizedPreferredSkills = Array.isArray(preferredSkills)
    ? preferredSkills.map((skill) => String(skill).trim()).filter(Boolean)
    : [];

  const prompt = `
You are a senior talent acquisition partner writing a production-ready job description.
Create a high-quality job description for this role.

Rules:
- Return valid JSON only.
- The output must be specific, realistic, and employer-ready.
- Responsibilities and requirements should be concise, high-signal bullet text.
- Preferred qualifications should be helpful but not repetitive.
- The summary should explain the role's impact in 2-4 sentences.
- The closing pitch should be candidate-friendly and compelling without hype.

Role title: ${normalizedTitle}
Department: ${normalizedDepartment}
Location: ${normalizedLocation}
Employment type: ${normalizedEmploymentType}
Experience level: ${normalizedExperienceLevel}
Required skills: ${normalizedRequiredSkills.join(", ") || "Not provided"}
Preferred skills: ${normalizedPreferredSkills.join(", ") || "Not provided"}

Company overview:
${normalizedCompanyOverview}

Business goals for the role:
${normalizedGoals.map((goal, index) => `${index + 1}. ${goal}`).join("\n")}
`.trim();

  return generateStructuredOutput({
    taskName: "generateJobDescription",
    prompt,
    schema: jobDescriptionSchema,
    cachePayload: {
      title: normalizedTitle,
      department: normalizedDepartment,
      location: normalizedLocation,
      employmentType: normalizedEmploymentType,
      experienceLevel: normalizedExperienceLevel,
      companyOverview: normalizedCompanyOverview,
      goals: normalizedGoals,
      requiredSkills: normalizedRequiredSkills,
      preferredSkills: normalizedPreferredSkills
    }
  });
}

export async function generateEmbedding({
  text,
  taskType = "SEMANTIC_SIMILARITY"
}) {
  const normalizedText = requireString(text, "text", 5);
  const cacheKey = createCacheKey("embedding", {
    model: EMBEDDING_MODEL,
    taskType,
    text: normalizedText
  });
  const cached = await getCachedValue(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const client = getAiClient();
    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: normalizedText,
      taskType,
      outputDimensionality: 768
    });

    const embedding = normalizeEmbeddingResponse(response);
    await setCachedValue(cacheKey, embedding, CACHE_TTL_SECONDS * 4);
    return embedding;
  } catch (error) {
    console.error("Gemini embedding request failed", error);
    throw new AppError("Gemini embedding request failed", 502, [error.message]);
  }
}
