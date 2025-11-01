import { Injectable } from '@nestjs/common';

export interface UnsubscribeInfo {
  channel: 'email' | 'url';
  target: string;
}

@Injectable()
export class UnsubscribeExtractor {
  /**
   * Extract unsubscribe information from text
   */
  extract(text: string): UnsubscribeInfo | null {
    // Try to extract email first (higher priority)
    const emailInfo = this.extractEmail(text);
    if (emailInfo) {
      return emailInfo;
    }

    // Try to extract URL
    const urlInfo = this.extractUrl(text);
    if (urlInfo) {
      return urlInfo;
    }

    return null;
  }

  /**
   * Extract unsubscribe email
   */
  private extractEmail(text: string): UnsubscribeInfo | null {
    // Pattern 1: mailto: links
    const mailtoPattern =
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const mailtoMatch = text.match(mailtoPattern);

    if (mailtoMatch) {
      return {
        channel: 'email',
        target: mailtoMatch[1],
      };
    }

    // Pattern 2: Unsubscribe email addresses
    const unsubscribeEmailPattern =
      /(?:unsubscribe|stop|opt-?out|remove)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const emailMatch = text.match(unsubscribeEmailPattern);

    if (emailMatch) {
      return {
        channel: 'email',
        target: emailMatch[1],
      };
    }

    // Pattern 3: Any email near "unsubscribe" keywords
    const contextPattern = /unsubscribe|opt-?out|remove/i;
    if (contextPattern.test(text)) {
      const genericEmailPattern =
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      const genericMatch = text.match(genericEmailPattern);

      if (genericMatch) {
        return {
          channel: 'email',
          target: genericMatch[1],
        };
      }
    }

    return null;
  }

  /**
   * Extract unsubscribe URL
   */
  private extractUrl(text: string): UnsubscribeInfo | null {
    // Pattern 1: URLs with "unsubscribe" in the path
    const unsubscribeUrlPattern =
      /(https?:\/\/[^\s]+(?:unsubscribe|opt-?out|remove)[^\s]*)/i;
    const urlMatch = text.match(unsubscribeUrlPattern);

    if (urlMatch) {
      return {
        channel: 'url',
        target: urlMatch[1],
      };
    }

    // Pattern 2: Any URL near "unsubscribe" keywords
    const contextPattern = /unsubscribe|opt-?out|click.*here|remove/i;
    if (contextPattern.test(text)) {
      const genericUrlPattern = /(https?:\/\/[^\s]+)/i;
      const genericMatch = text.match(genericUrlPattern);

      if (genericMatch) {
        return {
          channel: 'url',
          target: genericMatch[1],
        };
      }
    }

    return null;
  }

  /**
   * Validate extracted information
   */
  validate(info: UnsubscribeInfo): boolean {
    if (info.channel === 'email') {
      return this.isValidEmail(info.target);
    }

    if (info.channel === 'url') {
      return this.isValidUrl(info.target);
    }

    return false;
  }

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
