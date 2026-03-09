import * as pdfjsLib from 'pdfjs-dist';

// Automatically use the correct version
const pdfjsVersion = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

console.log('Using PDF.js version:', pdfjsVersion);

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Extracting text from PDF:', file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    const result = fullText.trim();
    console.log('Extraction complete, length:', result.length);
    
    return result || 'No text content found in PDF';
    
  } catch (error: any) {
    console.error('PDF extraction failed:', error);
    return `PDF text extraction failed: ${error.message}`;
  }
}