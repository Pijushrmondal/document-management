import { extname } from 'path';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

// Allowed file types
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
];

// Max file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Multer configuration
export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req: Request, file: Express.Multer.File, callback) => {
      const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueSuffix);
    },
  }),
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};

// Extract text from file (mock implementation)
export function extractTextFromFile(
  filePath: string,
  mimeType: string,
): string {
  // In a real implementation, you would use libraries like:
  // - pdf-parse for PDFs
  // - mammoth for DOCX
  // - xlsx for Excel
  // For now, return mock text
  return `Mock extracted text from ${filePath}`;
}
