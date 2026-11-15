import { ValidationError } from '../errors';

export interface UploadedFileInput {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}

interface AllowedFormat {
  mimeType: string;
  extension: string;
  magic: Buffer;
}

const ALLOWED_FORMATS: AllowedFormat[] = [
  {
    mimeType: 'application/pdf',
    extension: '.pdf',
    magic: Buffer.from('%PDF-', 'ascii'),
  },
  {
    mimeType: 'application/epub+zip',
    extension: '.epub',
    magic: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  },
];

export class FileValidator {
  static sanitizeOriginalName(originalName: string, extension: string): string {
    const base = (originalName ?? '').split(/[\\/]/).pop() ?? '';
    const cleaned = base
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/[<>:"|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const withoutExtension = cleaned.toLowerCase().endsWith(extension)
      ? cleaned.slice(0, -extension.length)
      : cleaned;
    const safeBase = withoutExtension.replace(/^\.+/, '').trim() || 'material';
    return `${safeBase.slice(0, 180)}${extension}`;
  }

  static validate(input: UploadedFileInput, maxBytes: number): { originalName: string; mimeType: string } {
    if (!input.buffer || input.sizeBytes <= 0 || input.buffer.length === 0) {
      throw new ValidationError('El archivo está vacío');
    }
    if (input.sizeBytes > maxBytes) {
      throw new ValidationError(`El archivo supera el máximo de ${Math.floor(maxBytes / 1024 / 1024)} MB`);
    }

    const lowerName = (input.originalName ?? '').toLowerCase();
    const format = ALLOWED_FORMATS.find(
      (candidate) =>
        candidate.mimeType === input.mimeType && lowerName.endsWith(candidate.extension),
    );

    if (!format) {
      throw new ValidationError('Solo se aceptan archivos PDF o EPUB');
    }

    if (
      input.buffer.length < format.magic.length ||
      !input.buffer.subarray(0, format.magic.length).equals(format.magic)
    ) {
      throw new ValidationError('El contenido del archivo no coincide con su formato');
    }

    return {
      originalName: FileValidator.sanitizeOriginalName(input.originalName, format.extension),
      mimeType: format.mimeType,
    };
  }
}
