import { XMLParser } from "fast-xml-parser";
import { strFromU8, unzipSync } from "fflate";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import AppError from "./app-error.js";

const MAX_RESUME_FILE_SIZE = 8 * 1024 * 1024;
const MIN_PARSEABLE_TEXT_LENGTH = 200;
const PARSE_FAILURE_MESSAGE =
  "Unable to parse resume. Please upload a valid file.";
const supportedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const DOCX_XML_PATTERN = /^word\/(document|header\d+|footer\d+)\.xml$/;
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
  textNodeName: "text",
});

function decodeXmlEntities(text) {
  return String(text)
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function normalizeExtractedText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function isLikelyCorruptedText(text) {
  const normalized = String(text || "");

  if (!normalized) {
    return true;
  }

  const replacementCharacterCount = (normalized.match(/\uFFFD/g) || []).length;
  const printableAsciiCount = (
    normalized.match(/[A-Za-z0-9,.;:!?@()\-_/ ]/g) || []
  ).length;
  const totalLength = normalized.length;
  const printableRatio = printableAsciiCount / totalLength;
  const replacementRatio = replacementCharacterCount / totalLength;

  return replacementRatio > 0.02 || printableRatio < 0.35;
}

function validateResumeFile(file) {
  if (!file?.buffer || !file?.mimetype) {
    throw new AppError("Resume file is required", 422);
  }

  if (!supportedMimeTypes.has(file.mimetype)) {
    throw new AppError("Unsupported file type", 415);
  }

  if (!file.buffer.length || !file.size) {
    throw new AppError("Resume file is empty", 422);
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    throw new AppError("Resume file exceeds the maximum allowed size", 413);
  }
}

function assertExtractedTextQuality(text) {
  if (
    !text ||
    text.length < MIN_PARSEABLE_TEXT_LENGTH ||
    isLikelyCorruptedText(text)
  ) {
    throw new AppError(PARSE_FAILURE_MESSAGE, 422);
  }
}

function collectWordText(node) {
  if (node == null) {
    return "";
  }

  if (Array.isArray(node)) {
    return node.map(collectWordText).join("");
  }

  if (typeof node === "string") {
    return decodeXmlEntities(node);
  }

  if (typeof node !== "object") {
    return "";
  }

  let output = "";

  for (const [key, value] of Object.entries(node)) {
    if (key === "text") {
      output += decodeXmlEntities(value);
      continue;
    }

    if (key === "tab") {
      output += " ";
      continue;
    }

    if (key === "br" || key === "cr") {
      output += "\n";
      continue;
    }

    output += collectWordText(value);

    if (key === "p") {
      output += "\n";
    }
  }

  return output;
}

async function extractTextFromPdfBuffer(buffer) {
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => (typeof item.str === "string" ? item.str : ""))
        .join(" ");
      pages.push(pageText);
    }

    return normalizeExtractedText(pages.join("\n"));
  } catch (_error) {
    throw new AppError("Failed to read PDF file", 422);
  }
}

async function extractTextFromDocxBuffer(buffer) {
  try {
    const zipEntries = unzipSync(new Uint8Array(buffer));
    const xmlFilePaths = Object.keys(zipEntries)
      .filter((path) => DOCX_XML_PATTERN.test(path))
      .sort();

    if (!xmlFilePaths.length) {
      throw new AppError("Invalid DOCX file structure", 422);
    }

    const chunks = [];

    for (const path of xmlFilePaths) {
      const xml = strFromU8(zipEntries[path]);
      const parsed = xmlParser.parse(xml);
      chunks.push(collectWordText(parsed));
    }

    return normalizeExtractedText(chunks.join("\n"));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to read DOCX file", 422);
  }
}

export async function extractTextFromFile(file) {
  try {
    validateResumeFile(file);

    if (file.mimetype === "application/pdf") {
      const text = await extractTextFromPdfBuffer(file.buffer);

      if (!text) {
        throw new AppError(PARSE_FAILURE_MESSAGE, 422);
      }

      assertExtractedTextQuality(text);

      return text;
    }

    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const text = await extractTextFromDocxBuffer(file.buffer);

      if (!text) {
        throw new AppError(PARSE_FAILURE_MESSAGE, 422);
      }

      assertExtractedTextQuality(text);

      return text;
    }

    if (file.mimetype === "text/plain") {
      const text = normalizeExtractedText(file.buffer.toString("utf8"));

      if (!text) {
        throw new AppError(PARSE_FAILURE_MESSAGE, 422);
      }

      assertExtractedTextQuality(text);

      return text;
    }

    throw new AppError("Unsupported file type", 415);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 422) {
      throw new AppError(PARSE_FAILURE_MESSAGE, 422);
    }

    throw error;
  }
}
