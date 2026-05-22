import { Global, Module } from '@nestjs/common';
import { CryptoModule } from '../../common/crypto/crypto.module';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [CryptoModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
