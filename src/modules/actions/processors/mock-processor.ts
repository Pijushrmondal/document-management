import { Injectable } from '@nestjs/common';

export interface ProcessorContext {
  documents: Array<{
    id: string;
    filename: string;
    textContent: string;
  }>;
}

export interface ProcessorMessage {
  role: string;
  content: string;
}

export interface ProcessorOutput {
  type: string;
  filename: string;
  content: string;
}

@Injectable()
export class MockProcessor {
  /**
   * Process action request and generate deterministic output
   */
  process(
    context: ProcessorContext,
    messages: ProcessorMessage[],
    actions: string[],
  ): ProcessorOutput[] {
    const outputs: ProcessorOutput[] = [];

    for (const action of actions) {
      if (action === 'make_csv') {
        outputs.push(this.generateCSV(context, messages));
      } else if (action === 'make_document') {
        outputs.push(this.generateDocument(context, messages));
      }
    }

    return outputs;
  }

  /**
   * Generate CSV from document context
   */
  private generateCSV(
    context: ProcessorContext,
    messages: ProcessorMessage[],
  ): ProcessorOutput {
    const userMessage = messages.find((m) => m.role === 'user')?.content || '';

    // Extract what kind of CSV to make from user message
    if (userMessage.toLowerCase().includes('vendor')) {
      return this.generateVendorTotalsCSV(context);
    }

    // Default: document summary CSV
    return this.generateDocumentSummaryCSV(context);
  }

  /**
   * Generate vendor totals CSV
   */
  private generateVendorTotalsCSV(context: ProcessorContext): ProcessorOutput {
    // Mock: Extract vendor names and amounts from document content
    const vendors = new Map<string, number>();

    context.documents.forEach((doc) => {
      // Simple mock extraction - in real implementation, use NLP
      const vendorMatch = doc.textContent.match(/vendor[:\s]+(\w+)/i);
      const amountMatch = doc.textContent.match(
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      );

      if (vendorMatch && amountMatch) {
        const vendor = vendorMatch[1];
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

        vendors.set(vendor, (vendors.get(vendor) || 0) + amount);
      }
    });

    // Generate CSV
    let csvContent = 'Vendor,Total\n';
    vendors.forEach((total, vendor) => {
      csvContent += `${vendor},$${total.toFixed(2)}\n`;
    });

    // Add totals row
    const grandTotal = Array.from(vendors.values()).reduce((a, b) => a + b, 0);
    csvContent += `Total,$${grandTotal.toFixed(2)}\n`;

    return {
      type: 'csv',
      filename: 'vendor_totals.csv',
      content: csvContent,
    };
  }

  /**
   * Generate document summary CSV
   */
  private generateDocumentSummaryCSV(
    context: ProcessorContext,
  ): ProcessorOutput {
    let csvContent = 'Filename,WordCount,CharCount\n';

    context.documents.forEach((doc) => {
      const wordCount = doc.textContent.split(/\s+/).length;
      const charCount = doc.textContent.length;
      csvContent += `${doc.filename},${wordCount},${charCount}\n`;
    });

    return {
      type: 'csv',
      filename: 'document_summary.csv',
      content: csvContent,
    };
  }

  /**
   * Generate text document
   */
  private generateDocument(
    context: ProcessorContext,
    messages: ProcessorMessage[],
  ): ProcessorOutput {
    const userMessage = messages.find((m) => m.role === 'user')?.content || '';

    // Mock: Generate a summary report
    let content = '# Document Analysis Report\n\n';
    content += `## User Request\n${userMessage}\n\n`;
    content += `## Analyzed Documents\n`;
    content += `Total: ${context.documents.length}\n\n`;

    context.documents.forEach((doc, index) => {
      content += `### ${index + 1}. ${doc.filename}\n`;
      content += `- Words: ${doc.textContent.split(/\s+/).length}\n`;
      content += `- Characters: ${doc.textContent.length}\n`;
      content += `- Preview: ${doc.textContent.substring(0, 100)}...\n\n`;
    });

    content += `## Summary\n`;
    content += `This report was generated based on ${context.documents.length} documents.\n`;

    return {
      type: 'document',
      filename: 'analysis_report.md',
      content,
    };
  }
}
