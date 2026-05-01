import AppError from "../utils/app-error.js";

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
    return response.status(409).json({
      message: "A record with this value already exists"
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details || undefined
    });
  }

  console.error(error);

  return response.status(500).json({
    message: "Internal server error"
  });
}

export default errorHandler;
