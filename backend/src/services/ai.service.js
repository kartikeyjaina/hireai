import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { getRedisClient } from "../config/redis.js";
import AppError from "../utils/app-error.js";

const CACHE_TTL_SECONDS = 60 * 60 * 6;
const EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_AI_TIMEOUT_MS = 25_000;
const DEFAULT_AI_RETRIES = 2;

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
    return null;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
}

function isAiAvailable() {
  return Boolean(process.env.GEMINI_API_KEY);
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

    if (!redis) {
      return null;
    }

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

    if (!redis) {
      return;
    }

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

function buildTimeoutError(taskName, timeoutMs) {
  return new AppError(`AI timeout for ${taskName}`, 504, [
    `The AI request exceeded ${timeoutMs}ms`
  ]);
}

function withTimeout(promise, taskName, timeoutMs = DEFAULT_AI_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(buildTimeoutError(taskName, timeoutMs));
      }, timeoutMs);
    })
  ]);
}

function sanitizeModelJson(text) {
  const value = String(text || "").trim();

  if (value.startsWith("```") && value.endsWith("```")) {
    return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  return value;
}

function parseJsonSafely(text, taskName) {
  try {
    return JSON.parse(sanitizeModelJson(text));
  } catch (error) {
    throw new AppError(`Invalid JSON returned for ${taskName}`, 502, [error.message]);
  }
}

function validateShapeWithSchema(schema, payload, path = "root") {
  if (!schema || !payload || typeof payload !== "object") {
    return false;
  }

  if (Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (payload[key] === undefined || payload[key] === null) {
        return false;
      }
    }
  }

  const schemaProperties = schema.properties || {};

  for (const [key, propertySchema] of Object.entries(schemaProperties)) {
    if (payload[key] === undefined || payload[key] === null) {
      continue;
    }

    const value = payload[key];

    if (propertySchema.type === "array") {
      if (!Array.isArray(value)) {
        return false;
      }

      if (propertySchema.items?.type === "object") {
        const itemSchema = {
          type: "object",
          properties: propertySchema.items.properties || {},
          required: propertySchema.items.required || []
        };

        if (!value.every((item) => validateShapeWithSchema(itemSchema, item, `${path}.${key}`))) {
          return false;
        }
      }
    }

    if (propertySchema.type === "object") {
      if (!validateShapeWithSchema(propertySchema, value, `${path}.${key}`)) {
        return false;
      }
    }
  }

  return true;
}

export async function safeAiCall(taskName, fn, options = {}) {
  const timeoutMs = Number(options.timeoutMs) || DEFAULT_AI_TIMEOUT_MS;
  const retries = Math.max(Number(options.retries ?? DEFAULT_AI_RETRIES), 0);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withTimeout(Promise.resolve().then(fn), taskName, timeoutMs);
    } catch (error) {
      lastError = error;
      const details = [
        `attempt=${attempt + 1}`,
        `task=${taskName}`,
        error?.message || "Unknown AI error"
      ];

      console.error("AI call failure", {
        taskName,
        attempt: attempt + 1,
        retries,
        message: error?.message,
        stack: error?.stack,
        context: options.context || null
      });

      if (attempt === retries) {
        if (error instanceof AppError) {
          throw new AppError(error.message, error.statusCode || 502, [...(error.details || []), ...details]);
        }

        throw new AppError(`AI call failed for ${taskName}`, 502, details);
      }
    }
  }

  throw lastError;
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
  ttlSeconds = CACHE_TTL_SECONDS,
  fallback = null
}) {
  if (!isAiAvailable()) {
    console.warn(`AI unavailable (no GEMINI_API_KEY): skipping ${taskName}`);
    if (fallback !== null) return fallback;
    throw new AppError("AI features are not configured. Please set GEMINI_API_KEY.", 503);
  }

  const cacheKey = createCacheKey(taskName, cachePayload);
  const cached = await getCachedValue(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const response = await safeAiCall(
      taskName,
      async () => {
        const client = getAiClient();
        return client.models.generateContent({
          model: getModelName(),
          contents: prompt,
          config: buildGenerationConfig(schema)
        });
      },
      {
        context: {
          cacheKey,
          model: getModelName()
        }
      }
    );

    if (!response?.text) {
      throw new AppError(`Gemini returned an empty response for ${taskName}`, 502);
    }

    const parsed = parseJsonSafely(response.text, taskName);

    if (!validateShapeWithSchema(schema, parsed)) {
      throw new AppError(`Gemini returned an invalid response shape for ${taskName}`, 502);
    }

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
    cachePayload: { resumeText: normalizedResumeText, targetRole, companyContext },
    fallback: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      currentTitle: "",
      summary: "",
      totalYearsExperience: 0,
      skills: [],
      workExperience: [],
      education: [],
      certifications: []
    }
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
    },
    fallback: {
      score: 0,
      recommendation: "mixed",
      strengths: [],
      concerns: ["AI scoring unavailable"],
      summary: "AI scoring is not configured. Please set GEMINI_API_KEY."
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

  if (!isAiAvailable()) {
    console.warn("AI unavailable (no GEMINI_API_KEY): skipping embedding generation");
    return [];
  }

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
    const response = await safeAiCall(
      "generateEmbedding",
      async () => {
        const client = getAiClient();
        return client.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: normalizedText,
          taskType,
          outputDimensionality: 768
        });
      },
      {
        context: {
          taskType,
          textLength: normalizedText.length
        }
      }
    );

    const embedding = normalizeEmbeddingResponse(response);
    await setCachedValue(cacheKey, embedding, CACHE_TTL_SECONDS * 4);
    return embedding;
  } catch (error) {
    console.error("Gemini embedding request failed", error);
    throw new AppError("Gemini embedding request failed", 502, [error.message]);
  }
}
