import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../../common/crypto/crypto.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface StoredEncryptedObject {
  originalFileName: string;
  mimeType: string;
  sizeBytes: bigint;
  checksumSha256: string;
  s3Bucket: string;
  s3Key: string;
  encryptionAlgorithm: string;
  encryptionIvBase64: string;
  encryptionAuthTagBase64: string;
  encryptionKeyVersion: string;
}

@Injectable()
export class StorageService {
  private readonly storageRoot: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {
    this.storageRoot = this.configService.get<string>('LOCAL_STORAGE_ROOT') || 'uploads/encrypted';
  }

  async uploadEncryptedFile(input: {
    buffer: Buffer;
    originalFileName: string;
    mimeType: string;
    keyPrefix: string;
  }): Promise<StoredEncryptedObject> {
    // Encrypt file content using CryptoService
    const encrypted = this.cryptoService.encryptBuffer(input.buffer);
    const checksum = this.cryptoService.sha256(input.buffer);

    const s3Key = `${input.keyPrefix}/${Date.now()}-${input.originalFileName}`;
    const targetPath = path.join(this.storageRoot, s3Key);

    // Ensure directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // Write encrypted ciphertext to file
    await fs.writeFile(targetPath, encrypted.ciphertext);

    return {
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: BigInt(input.buffer.length),
      checksumSha256: checksum,
      s3Bucket: this.configService.get<string>('AWS_S3_BUCKET') || 'local-bucket',
      s3Key,
      encryptionAlgorithm: encrypted.algorithm,
      encryptionIvBase64: encrypted.ivBase64,
      encryptionAuthTagBase64: encrypted.authTagBase64,
      encryptionKeyVersion: encrypted.keyVersion,
    };
  }

  async downloadDecryptedFile(s3Key: string, ivBase64: string, authTagBase64: string): Promise<Buffer> {
    const targetPath = path.join(this.storageRoot, s3Key);
    const ciphertext = await fs.readFile(targetPath);
    return this.cryptoService.decryptBuffer(ciphertext, ivBase64, authTagBase64);
  }
}
