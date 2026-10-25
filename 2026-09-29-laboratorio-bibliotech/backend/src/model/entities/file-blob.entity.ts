import { randomUUID } from 'crypto';

export interface FileBlobProps {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export class FileBlob {
  private constructor(private readonly props: FileBlobProps) {}

  static create(input: {
    storageKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    now?: Date;
  }): FileBlob {
    return new FileBlob({
      id: randomUUID(),
      storageKey: input.storageKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      createdAt: input.now ?? new Date(),
    });
  }

  static rehydrate(props: FileBlobProps): FileBlob {
    return new FileBlob({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get storageKey(): string {
    return this.props.storageKey;
  }

  get originalName(): string {
    return this.props.originalName;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): FileBlobProps {
    return { ...this.props };
  }
}
