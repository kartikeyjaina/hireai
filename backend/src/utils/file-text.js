import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import AppError from "./app-error.js";

export async function extractTextFromFile(file) {
  if (!file?.buffer || !file?.mimetype) {
    throw new AppError("Resume file is required", 422);
  }

  if (file.mimetype === "application/pdf") {
    const result = await pdfParse(file.buffer);
    const text = result.text?.trim();

    if (!text) {
      throw new AppError("No readable text was found in the PDF", 422);
    }

    return text;
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer
    });
    const text = result.value?.trim();

    if (!text) {
      throw new AppError("No readable text was found in the DOCX file", 422);
    }

    return text;
  }

  if (file.mimetype === "text/plain") {
    const text = file.buffer.toString("utf8").trim();

    if (!text) {
      throw new AppError("The text file is empty", 422);
    }

    return text;
  }

  throw new AppError("Unsupported file type", 415);
}
