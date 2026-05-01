import AppError from "../utils/app-error.js";

const isDev = process.env.NODE_ENV !== "production";

function errorHandler(error, _request, response, _next) {
  if (error?.name === "MulterError") {
    return response.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Resume file exceeds the 8MB upload limit"
          : "File upload failed"
    });
  }

  if (error?.name === "ValidationError") {
    return response.status(422).json({
      message: "Validation failed",
      details: Object.values(error.errors).map((entry) => entry.message)
    });
  }

  if (error?.code === 11000) {
    // Extract the duplicate field name from the error for a clearer message
    const field = Object.keys(error.keyValue || {})[0] || "field";
    return response.status(409).json({
      message: `A record with this ${field} already exists`
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details || undefined,
      ...(isDev && error.statusCode >= 500 ? { stack: error.stack } : {})
    });
  }

  console.error("Unhandled error:", error);

  return response.status(500).json({
    message: "Internal server error",
    ...(isDev ? { stack: error?.stack, detail: error?.message } : {})
  });
}

export default errorHandler;
