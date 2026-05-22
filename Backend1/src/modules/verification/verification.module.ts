import { Module } from '@nestjs/common';
import { CredentialModule } from '../credential/credential.module';
import { VerificationController } from './verification.controller';
import { VerificationRequestsController } from './verification-requests.controller';
import { VerificationRepository } from './verification.repository';
import { VerificationService } from './verification.service';

@Module({
  imports: [CredentialModule],
  controllers: [VerificationController, VerificationRequestsController],
  providers: [VerificationRepository, VerificationService],
  exports: [VerificationService, VerificationRepository],
})
export class VerificationModule {}

