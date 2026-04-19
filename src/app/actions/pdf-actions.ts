'use server';

import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import * as Tesseract from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import pdf from 'pdf-parse';
import JSZip from 'jszip';

export type ProcessResult = {
  success: boolean;
  dataUrls?: string[]; // Support multiple output files
  dataUrl?: string;    // Single output file
  error?: string;
  text?: string;
  pageCount?: number;
  auditResults?: {
    links: string[];
    hasJavascript: boolean;
    suspiciousObjects: string[];
  };
};

/**
 * Deep structural analysis of a PDF for security triggers.
 */
export async function auditPdfStructure(pdfBase64: string): Promise<ProcessResult> {
  try {
    const bytes = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const pdfDoc = await PDFDocument.load(bytes);
    
    // Check for JavaScript or Auto-execution triggers
    const rawContent = bytes.toString('utf-8');
    const hasJavascript = rawContent.includes('/JS') || rawContent.includes('/JavaScript');
    
    const suspiciousObjects = [];
    if (rawContent.includes('/OpenAction')) suspiciousObjects.push('Auto-Execution Trigger (/OpenAction)');
    if (rawContent.includes('/AcroForm')) suspiciousObjects.push('Form Data Manipulation (/AcroForm)');
    if (rawContent.includes('/EmbeddedFile')) suspiciousObjects.push('Embedded Binary Object (/EmbeddedFile)');

    // Extract basic links via simple text search (simplified for prototype)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = Array.from(new Set(rawContent.match(urlRegex) || []));

    // Get basic text content for OCR fallback
    const data = await pdf(bytes);

    return { 
      success: true, 
      text: data.text,
      auditResults: {
        links,
        hasJavascript,
        suspiciousObjects
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Merges multiple PDFs into one.
 */
export async function mergePdfs(pdfBase64s: string[]): Promise<ProcessResult> {
  try {
    const mergedPdf = await PDFDocument.create();
    for (const base64 of pdfBase64s) {
      const bytes = Buffer.from(base64.split(',')[1], 'base64');
      const doc = await PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const mergedPdfBytes = await mergedPdf.save();
    const resultBase64 = `data:application/pdf;base64,${Buffer.from(mergedPdfBytes).toString('base64')}`;
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Splits a PDF into multiple documents based on ranges or individual pages.
 */
export async function splitPdf(
  pdfBase64: string, 
  ranges: { start: number; end: number }[]
): Promise<ProcessResult> {
  try {
    const bytes = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const sourceDoc = await PDFDocument.load(bytes);
    const outputDataUrls: string[] = [];

    for (const range of ranges) {
      const newDoc = await PDFDocument.create();
      const pageIndices = [];
      for (let i = range.start - 1; i < range.end; i++) {
        if (i >= 0 && i < sourceDoc.getPageCount()) {
          pageIndices.push(i);
        }
      }
      
      const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
      copiedPages.forEach(page => newDoc.addPage(page));
      
      const pdfBytes = await newDoc.save();
      outputDataUrls.push(`data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`);
    }

    return { success: true, dataUrls: outputDataUrls };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Extracts specific pages into a new single PDF.
 */
export async function extractPages(pdfBase64: string, pagesToExtract: number[]): Promise<ProcessResult> {
  try {
    const bytes = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const sourceDoc = await PDFDocument.load(bytes);
    const newDoc = await PDFDocument.create();
    
    const sortedPages = [...pagesToExtract].sort((a, b) => a - b);
    const pageIndices = sortedPages.map(p => p - 1);
    
    const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach(page => newDoc.addPage(page));

    const resultBytes = await newDoc.save();
    const resultBase64 = `data:application/pdf;base64,${Buffer.from(resultBytes).toString('base64')}`;
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Organizes a PDF by reordering, rotating, and filtering pages.
 */
export async function organizePdf(
  pdfBase64: string,
  pagesConfig: { originalIndex: number; rotation: number }[]
): Promise<ProcessResult> {
  try {
    const bytes = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const sourceDoc = await PDFDocument.load(bytes);
    const newDoc = await PDFDocument.create();

    for (const config of pagesConfig) {
      const [copiedPage] = await newDoc.copyPages(sourceDoc, [config.originalIndex]);
      copiedPage.setRotation(degrees(config.rotation));
      newDoc.addPage(copiedPage);
    }

    const pdfBytes = await newDoc.save();
    const resultBase64 = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Compresses a PDF by optimizing its internal structure and removing overhead.
 */
export async function compressPdf(pdfBase64: string, level: 'low' | 'medium' | 'high'): Promise<ProcessResult> {
  try {
    const bytes = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const pdfDoc = await PDFDocument.load(bytes);
    
    const resultBytes = await pdfDoc.save({
      useObjectStreams: level === 'high',
      addDefaultExternalId: false,
    });

    const resultBase64 = `data:application/pdf;base64,${Buffer.from(resultBytes).toString('base64')}`;
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Gets the page count of a PDF.
 */
export async function getPdfInfo(pdfBase64: string): Promise<ProcessResult> {
  try {
    const bytes = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const doc = await PDFDocument.load(bytes);
    return { success: true, pageCount: doc.getPageCount() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Removes specified pages from a PDF.
 */
export async function removePages(pdfBase64: string, pagesToRemove: number[]): Promise<ProcessResult> {
  try {
    const bytes = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const doc = await PDFDocument.load(bytes);
    
    const sortedIndices = [...pagesToRemove].sort((a, b) => b - a);
    sortedIndices.forEach(index => {
      if (index >= 0 && index < doc.getPageCount()) {
        doc.removePage(index);
      }
    });

    const resultBytes = await doc.save();
    const resultBase64 = `data:application/pdf;base64,${Buffer.from(resultBytes).toString('base64')}`;
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Extracts all text from a PDF. Use pdf-parse for digital PDFs and Tesseract for images.
 */
export async function pdfToText(pdfOrImageBase64: string): Promise<ProcessResult> {
  try {
    const mimeType = pdfOrImageBase64.split(';')[0].split(':')[1];
    const dataBuffer = Buffer.from(pdfOrImageBase64.split(',')[1], 'base64');

    if (mimeType === 'application/pdf') {
      const data = await pdf(dataBuffer);
      return { success: true, text: data.text || "No text could be extracted from this PDF." };
    } else {
      // Use OCR for images
      const worker = await Tesseract.createWorker('eng');
      const { data: { text } } = await worker.recognize(pdfOrImageBase64);
      await worker.terminate();
      return { success: true, text };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Converts multiple images to a single PDF (Scan to PDF feature).
 */
export async function imagesToPdf(imageDataUrls: string[]): Promise<ProcessResult> {
  try {
    const pdfDoc = await PDFDocument.create();
    for (const dataUrl of imageDataUrls) {
      const bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
      
      // Handle both JPEG and PNG based on data URL prefix
      let image;
      if (dataUrl.includes('image/png')) {
        image = await pdfDoc.embedPng(bytes);
      } else {
        image = await pdfDoc.embedJpg(bytes);
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
    const pdfBytes = await pdfDoc.save();
    const resultBase64 = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Creates a Word document from text.
 */
export async function textToWord(text: string): Promise<ProcessResult> {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => {
          if (!line.trim()) return null;
          return new Paragraph({
            children: [new TextRun(line)],
          });
        }).filter(Boolean) as Paragraph[],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const resultBase64 = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${buffer.toString('base64')}`;
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Tracks a PDF to JPG conversion.
 */
export async function logPdfToJpgConversion(fileName: string, pageCount: number): Promise<ProcessResult> {
  try {
    // This action simulates the backend's knowledge of the high-res rendering process
    console.log(`Processing high-res JPG conversion for: ${fileName} (${pageCount} pages)`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Converts a PowerPoint presentation (.pptx) to a PDF.
 * Note: For this prototype, we extract text content from slides and reconstruct them as pages.
 */
export async function convertPptToPdf(pptBase64: string, fileName: string): Promise<ProcessResult> {
  try {
    const buffer = Buffer.from(pptBase64.split(',')[1], 'base64');
    const zip = await JSZip.loadAsync(buffer);
    
    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Get slides list
    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
    
    // Sort slide files correctly (slide1.xml, slide2.xml, etc.)
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

    if (slideFiles.length === 0) {
      throw new Error("No slides found in the presentation or invalid format.");
    }

    // Process each slide
    for (const slidePath of slideFiles) {
      const slideXml = await zip.file(slidePath)?.async('string');
      if (!slideXml) continue;

      // Extract text content using regex (simulating slide parsing)
      const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const slideText = textMatches.map(m => m.replace(/<a:t>|<\/a:t>/g, '')).filter(t => t.trim().length > 0);

      // Create PDF page for slide
      const page = pdfDoc.addPage([842, 595]); // Landscape A4 approximately
      
      // Draw header
      page.drawText(`Slide ${slidePath.match(/slide(\d+)/)?.[1]}`, {
        x: 50,
        y: 550,
        size: 12,
        font: boldFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Draw content
      let currentY = 500;
      for (const text of slideText) {
        if (currentY < 50) break; // Simple overflow check
        page.drawText(text, {
          x: 50,
          y: currentY,
          size: 14,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentY -= 25;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const resultBase64 = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
    
    return { success: true, dataUrl: resultBase64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
