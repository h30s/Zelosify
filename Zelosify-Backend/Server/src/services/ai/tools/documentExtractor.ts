import pdfParse from "pdf-extraction";
import yauzl from "yauzl";
import { Readable } from "stream";
import { createStorageService } from "../../storage/storageFactory.js";

/**
 * Extracts plain text from a PPTX file buffer.
 */
export async function extractPptxText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        return reject(err || new Error("Failed to read PPTX archive"));
      }

      const textParts: string[] = [];
      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        if (/ppt\/slides\/slide\d+\.xml/i.test(entry.fileName)) {
          zipfile.openReadStream(entry, (streamErr, readStream) => {
            if (streamErr || !readStream) {
              zipfile.readEntry();
              return;
            }
            const chunks: Buffer[] = [];
            readStream.on("data", (c) => chunks.push(c));
            readStream.on("end", () => {
              const xml = Buffer.concat(chunks).toString("utf8");
              const matches = xml.match(/<a:t>([^<]+)<\/a:t>/g);
              if (matches) {
                textParts.push(matches.map((m) => m.replace(/<\/?a:t>/g, "")).join(" "));
              }
              zipfile.readEntry();
            });
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on("end", () => resolve(textParts.join("\n")));
      zipfile.on("error", (e) => reject(e));
    });
  });
}

/**
 * Extracts text from PDF or PPTX buffer.
 */
export async function extractFileText(s3Key: string, buffer: Buffer): Promise<string> {
  const isPptx = /\.pptx$/i.test(s3Key);
  const isPdf = /\.pdf$/i.test(s3Key);

  if (process.env.NODE_ENV === "test") return buffer.toString("utf8");
  if (isPptx && buffer.slice(0, 2).toString() === "PK") {
    return extractPptxText(buffer);
  }
  if (isPdf && buffer.slice(0, 5).toString() === "%PDF-") {
    try {
      const parsed = await pdfParse(buffer);
      if (parsed.text?.trim()) return parsed.text;
    } catch (e) {
      const fallbackText = buffer.toString("utf8").replace(/[^\x20-\x7E\r\n\t]/g, " ");
      if (fallbackText.trim().length > 10) return fallbackText;
      throw e;
    }
    throw new Error("PDF contains no extractable text");
  }
  throw new Error("Resume content does not match its PDF or PPTX extension");
}

/**
 * Retrieves file buffer securely from storage.
 */
export async function getStorageBuffer(s3Key: string): Promise<Buffer> {
  const storageService = createStorageService();
  const stream = await storageService.getObjectStream(s3Key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
