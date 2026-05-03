import { PDFParse } from 'pdf-parse';


export const extractText = async (fileBuffer: Buffer): Promise<string> => {
  try {
    const parser = new PDFParse({ data: fileBuffer });
    const data = await parser.getText();

    // Clean up the text: remove excessive newlines and weird spacing
    const cleanText = data.text
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();

    return cleanText;
  } catch (error) {
    console.error("[PdfParserUtil] Failed to parse PDF:", error);
    throw new Error("Could not extract text from the provided PDF.");
  }
};
