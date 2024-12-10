import fs from 'fs'
import { getDocument }  from "pdfjs-dist/legacy/build/pdf.mjs";
   
   
   
   
   // Function to extract text from a PDF
    const extractTextFromPDF = async (filePath) => {
        try {
            // Read the PDF file into a Uint8Array
            const data = new Uint8Array(fs.readFileSync(filePath));
    
            // Load the PDF document
            const pdfDocument = await getDocument({ data }).promise;
    
            let cvText = '';
    
            // Iterate over each page in the PDF
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                
                // Extract the text from each page
                const pageText = textContent.items.map(item => item.str).join(' ');
                cvText += pageText + '\n';
            }
    
            return cvText;
    
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            throw error;
        }
    };


    export {extractTextFromPDF}