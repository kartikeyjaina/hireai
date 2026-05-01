import rateLimit from "express-rate-limit";

function buildKey(request) {
  if (request.user?.id) {
    return `user:${request.user.id}`;
  }

  return `ip:${request.ip || "unknown"}`;
}

function buildHandler(message) {
  return (_request, response) => {
    response.status(429).json({
      message,
      details: ["Too many requests. Please try again shortly."]
    });
  };
}

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  handler: buildHandler("AI rate limit exceeded")
});

export const resumeUploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  handler: buildHandler("Resume upload rate limit exceeded")
});
