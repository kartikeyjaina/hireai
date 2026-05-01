import multer from "multer";
import AppError from "../utils/app-error.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

const storage = multer.memoryStorage();

function fileFilter(_request, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(
      new AppError(
        "Unsupported resume format. Upload PDF, DOCX, or TXT files only",
        415
      )
    );
    return;
  }

  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

export const uploadResume = [
  upload.single("resume"),
  (request, _response, next) => {
    if (!request.file || !request.file.size) {
      return next(new AppError("Resume file is required and cannot be empty", 422));
    }

    return next();
  }
];
