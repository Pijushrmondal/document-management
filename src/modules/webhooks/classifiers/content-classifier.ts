import { Injectable } from '@nestjs/common';
import { ContentClassification } from 'src/database/schemas/webhook-event.schema';

@Injectable()
export class ContentClassifier {
  // Keywords for official documents
  private readonly OFFICIAL_KEYWORDS = [
    'invoice',
    'contract',
    'legal',
    'tax',
    'payment',
    'receipt',
    'statement',
    'bill',
    'agreement',
    'policy',
    'notice',
    'official',
    'court',
    'government',
    'license',
    'certificate',
    'deed',
    'will',
    'testament',
  ];

  // Keywords for advertisements
  private readonly AD_KEYWORDS = [
    'sale',
    'offer',
    'discount',
    'unsubscribe',
    'promotion',
    'limited time',
    'buy now',
    'deal',
    'save',
    'free shipping',
    'coupon',
    'promo',
    'exclusive',
    'special offer',
    'clearance',
    'bargain',
    'subscribe',
    'newsletter',
    'marketing',
  ];

  /**
   * Classify text content
   */
  classify(text: string): ContentClassification {
    const lowerText = text.toLowerCase();

    // Check for official document keywords
    const officialScore = this.calculateScore(
      lowerText,
      this.OFFICIAL_KEYWORDS,
    );

    // Check for ad keywords
    const adScore = this.calculateScore(lowerText, this.AD_KEYWORDS);

    // Determine classification based on scores
    if (officialScore === 0 && adScore === 0) {
      return ContentClassification.UNKNOWN;
    }

    if (officialScore > adScore) {
      return ContentClassification.OFFICIAL;
    }

    if (adScore > officialScore) {
      return ContentClassification.AD;
    }

    // If scores are equal, check for specific patterns
    if (this.hasUnsubscribePattern(lowerText)) {
      return ContentClassification.AD;
    }

    return ContentClassification.UNKNOWN;
  }

  /**
   * Calculate keyword match score
   */
  private calculateScore(text: string, keywords: string[]): number {
    let score = 0;

    for (const keyword of keywords) {
      // Use word boundaries to match whole words
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        score += matches.length;
      }
    }

    return score;
  }

  /**
   * Check if text has unsubscribe patterns
   */
  private hasUnsubscribePattern(text: string): boolean {
    const unsubscribePatterns = [
      /unsubscribe/i,
      /opt[\s-]?out/i,
      /remove.*email/i,
      /stop.*receiving/i,
      /click.*here.*unsubscribe/i,
    ];

    return unsubscribePatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Get classification confidence
   */
  getConfidence(text: string): {
    classification: ContentClassification;
    confidence: number;
  } {
    const lowerText = text.toLowerCase();
    const officialScore = this.calculateScore(
      lowerText,
      this.OFFICIAL_KEYWORDS,
    );
    const adScore = this.calculateScore(lowerText, this.AD_KEYWORDS);
    const totalScore = officialScore + adScore;

    const classification = this.classify(text);

    if (totalScore === 0) {
      return { classification, confidence: 0 };
    }

    const confidence =
      classification === ContentClassification.OFFICIAL
        ? officialScore / totalScore
        : classification === ContentClassification.AD
          ? adScore / totalScore
          : 0;

    return { classification, confidence: Math.round(confidence * 100) / 100 };
  }
}
