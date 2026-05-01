import { XMLParser } from "fast-xml-parser";
import { strFromU8, unzipSync } from "fflate";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import AppError from "./app-error.js";

const DOCX_XML_PATTERN = /^word\/(document|header\d+|footer\d+)\.xml$/;
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
  textNodeName: "text"
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
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
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
      disableFontFace: true
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
  if (!file?.buffer || !file?.mimetype) {
    throw new AppError("Resume file is required", 422);
  }

  if (file.mimetype === "application/pdf") {
    const text = await extractTextFromPdfBuffer(file.buffer);

    if (!text) {
      throw new AppError("No readable text was found in the PDF", 422);
    }

    return text;
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const text = await extractTextFromDocxBuffer(file.buffer);

    if (!text) {
      throw new AppError("No readable text was found in the DOCX file", 422);
    }

    return text;
  }

  if (file.mimetype === "text/plain") {
    const text = normalizeExtractedText(file.buffer.toString("utf8"));

    if (!text) {
      throw new AppError("The text file is empty", 422);
    }

    return text;
  }

  throw new AppError("Unsupported file type", 415);
}
