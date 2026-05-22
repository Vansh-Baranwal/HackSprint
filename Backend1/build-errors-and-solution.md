# Backend Compilation Errors & Solution

## Errors (7 total)

All 7 errors are `TS2307: Cannot find module` — the `storage` module directory at `src/modules/storage/` is completely missing.

### 1–3: `abuse-reports` module

```
src/modules/abuse-reports/abuse-reports.module.ts:4:31
  Cannot find module '../storage/storage.module'
  → imports { StorageModule }

src/modules/abuse-reports/abuse-reports.repository.ts:4:44
  Cannot find module '../storage/storage.service'
  → imports type { StoredEncryptedObject }

src/modules/abuse-reports/abuse-reports.service.ts:11:32
  Cannot find module '../storage/storage.service'
  → imports { StorageService }
```

### 4–6: `athlete` module

```
src/modules/athlete/athlete.module.ts:2:31
  Cannot find module '../storage/storage.module'
  → imports { StorageModule }

src/modules/athlete/athlete.repository.ts:4:44
  Cannot find module '../storage/storage.service'
  → imports type { StoredEncryptedObject }

src/modules/athlete/athlete.service.ts:5:32
  Cannot find module '../storage/storage.service'
  → imports { StorageService }
```

### 7: `app.module.ts`

```
src/app.module.ts:32:31
  Cannot find module './modules/storage/storage.module'
  → imports { StorageModule }
```

## Root Cause

`src/modules/storage/` directory doesn't exist. The NestJS `StorageModule` is imported by:
- `app.module.ts` (root module)
- `AthleteModule`
- `AbuseReportsModule`

The `StorageService` + `StoredEncryptedObject` type are imported by:
- `AthleteService`
- `AthleteRepository`
- `AbuseReportsService`
- `AbuseReportsRepository`

## What Each File Needs

### `storage.module.ts`

NestJS module that provides `StorageService` globally or to importing modules.

```typescript
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

### `storage.service.ts`

A service with an `uploadEncryptedFile` method and the `StoredEncryptedObject` type.

**`StoredEncryptedObject`** — used by repositories to write encrypted file metadata to DB:

| Field | Type | Source |
|---|---|---|
| `originalFileName` | `string` | `athlete.repository.ts:70`, `abuse-reports.repository.ts:66` |
| `mimeType` | `string` | `athlete.repository.ts:71`, `abuse-reports.repository.ts:67` |
| `sizeBytes` | `number` | `athlete.repository.ts:72`, `abuse-reports.repository.ts:68` |
| `checksumSha256` | `string` | `athlete.repository.ts:73`, `abuse-reports.repository.ts:69` |
| `s3Bucket` | `string \| null` | `athlete.repository.ts:74`, `abuse-reports.repository.ts:70` |
| `s3Key` | `string \| null` | `athlete.repository.ts:75`, `abuse-reports.repository.ts:71` |
| `encryptionAlgorithm` | `string` | `athlete.repository.ts:76`, `abuse-reports.repository.ts:72` |
| `encryptionIvBase64` | `string` | `athlete.repository.ts:77`, `abuse-reports.repository.ts:73` |
| `encryptionAuthTagBase64` | `string` | `athlete.repository.ts:78`, `abuse-reports.repository.ts:74` |
| `encryptionKeyVersion` | `number` | `athlete.repository.ts:79`, `abuse-reports.repository.ts:75` |

**`uploadEncryptedFile` method** — called by services:

- `AthleteService.uploadDocument()` (`athlete.service.ts:57`)
- `AbuseReportsService.addEvidence()` (`abuse-reports.service.ts:108`)

```typescript
uploadEncryptedFile(params: {
  buffer: Buffer;
  originalFileName: string;
  mimeType: string;
  keyPrefix: string;
}): Promise<StoredEncryptedObject>
```

## Solution Steps

### 1. Create directory

```bash
mkdir -p src/modules/storage
```

### 2. Create `src/modules/storage/storage.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface StoredEncryptedObject {
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  s3Bucket: string | null;
  s3Key: string | null;
  encryptionAlgorithm: string;
  encryptionIvBase64: string;
  encryptionAuthTagBase64: string;
  encryptionKeyVersion: number;
}

interface UploadEncryptedFileParams {
  buffer: Buffer;
  originalFileName: string;
  mimeType: string;
  keyPrefix: string;
}

@Injectable()
export class StorageService {
  private readonly masterKey: Buffer;
  private readonly storageRoot: string;
  private readonly keyVersion = 1;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    const keyBase64 = this.configService.getOrThrow<string>('DOCUMENT_MASTER_KEY_BASE64');
    this.masterKey = Buffer.from(keyBase64, 'base64');

    if (this.masterKey.length !== 32) {
      throw new Error('DOCUMENT_MASTER_KEY_BASE64 must decode to exactly 32 bytes');
    }

    this.storageRoot =
      this.configService.get<string>('FILE_STORAGE_DRIVER') === 'local'
        ? (this.configService.get<string>('LOCAL_STORAGE_ROOT') ?? 'uploads/encrypted')
        : '/tmp/encrypted';
  }

  async uploadEncryptedFile(params: UploadEncryptedFileParams): Promise<StoredEncryptedObject> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(params.buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex');

    const fileName = `${crypto.randomUUID()}-${params.originalFileName}`;
    const s3Key = `${params.keyPrefix}/${fileName}`;
    const filePath = path.join(this.storageRoot, s3Key);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, encrypted);

    return {
      originalFileName: params.originalFileName,
      mimeType: params.mimeType,
      sizeBytes: params.buffer.length,
      checksumSha256: checksum,
      s3Bucket: null,
      s3Key,
      encryptionAlgorithm: this.algorithm,
      encryptionIvBase64: iv.toString('base64'),
      encryptionAuthTagBase64: authTag.toString('base64'),
      encryptionKeyVersion: this.keyVersion,
    };
  }
}
```

### 3. Create `src/modules/storage/storage.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

### 4. Verify the build

```bash
cd Backend1
npx nest build
```

## Configuration (already in `.env`)

```
FILE_STORAGE_DRIVER=local
LOCAL_STORAGE_ROOT=uploads/encrypted
DOCUMENT_MASTER_KEY_BASE64=GmtpPlHqBLbpmb09l1EYPaWI4ex7TDulitx3TBYnie4=
```

The `DOCUMENT_MASTER_KEY_BASE64` must decode to exactly 32 bytes (AES-256).
