import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  UserRole,
  MembershipStatus,
  VerificationRequestStatus,
  ClaimVisibility,
  CredentialType,
} from '@prisma/client';
import { AuditAction } from '../../common/decorators/audit-action.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationService } from './verification.service';

@ApiTags('verification-requests')
@ApiBearerAuth()
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('verification-requests')
export class VerificationRequestsController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('my-requests')
  @Roles(UserRole.ATHLETE, UserRole.COACH, UserRole.FEDERATION, UserRole.ADMIN)
  async myRequests(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.prisma.athleteProfile.findFirst({
      where: { userId: user.id, deletedAt: null },
    });
    if (!profile) {
      return [];
    }

    return this.prisma.verificationRequest.findMany({
      where: { athleteProfileId: profile.id, deletedAt: null },
      include: {
        claims: {
          include: {
            evidenceDocument: true,
          },
        },
        federation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('pending')
  @Roles(UserRole.FEDERATION, UserRole.ADMIN)
  async pendingRequests(@CurrentUser() user: AuthenticatedUser) {
    const membership = await this.prisma.federationMembership.findFirst({
      where: { userId: user.id, status: MembershipStatus.ACTIVE },
    });

    if (!membership && !user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('No active federation membership found');
    }

    const whereClause: any = {
      status: { in: [VerificationRequestStatus.REQUESTED, VerificationRequestStatus.IN_REVIEW] },
      deletedAt: null,
    };

    if (membership) {
      whereClause.federationId = membership.federationId;
    }

    const requests = await this.prisma.verificationRequest.findMany({
      where: whereClause,
      include: {
        athleteProfile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            documents: {
              where: { deletedAt: null },
            },
          },
        },
        claims: {
          include: {
            evidenceDocument: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req: any) => {
      const docs = req.claims
        .map((c: any) => c.evidenceDocument)
        .filter(Boolean)
        .map((doc: any) => ({
          ...doc,
          sizeBytes: doc.sizeBytes.toString(),
        }));

      return {
        ...req,
        athlete: req.athleteProfile?.user
          ? {
              firstName: req.athleteProfile.user.firstName,
              lastName: req.athleteProfile.user.lastName,
            }
          : undefined,
        athleteProfile: req.athleteProfile
          ? {
              ...req.athleteProfile,
              documents: (req.athleteProfile.documents || []).map((doc: any) => ({
                ...doc,
                sizeBytes: doc.sizeBytes.toString(),
              })),
            }
          : undefined,
        documents: docs,
      };
    });
  }

  @Post()
  @AuditAction('verification.requested')
  @Roles(UserRole.ATHLETE, UserRole.COACH, UserRole.FEDERATION, UserRole.ADMIN)
  async request(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      federationId: string;
      purpose: string;
      requestedClaims?: {
        documentIds?: string[];
      };
    },
  ) {
    const profile = await this.prisma.athleteProfile.findFirst({
      where: { userId: user.id, deletedAt: null },
    });

    if (!profile) {
      throw new NotFoundException('Athlete profile not found. Please create profile details first.');
    }

    const docIds = body.requestedClaims?.documentIds || [];
    const claims: any[] = docIds.map((docId) => ({
      claimKey: 'evidence_document',
      claimValue: docId,
      evidenceDocumentId: docId,
    }));

    if (claims.length === 0) {
      claims.push({
        claimKey: 'verification_requested',
        claimValue: 'true',
        evidenceDocumentId: undefined,
      });
    }

    return this.verificationService.requestVerification(user, {
      athleteProfileId: profile.id,
      federationId: body.federationId,
      purpose: body.purpose,
      claims: claims,
    });
  }

  @Post(':id/approve')
  @AuditAction('verification.approved')
  @Roles(UserRole.FEDERATION, UserRole.ADMIN)
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body?: any,
  ) {
    const request = await this.prisma.verificationRequest.findFirst({
      where: { id, deletedAt: null },
      include: { claims: true },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    const credentialType = CredentialType.IDENTITY_VERIFIED;

    const approvedClaims = request.claims.map((claim: any) => ({
      claimKey: claim.claimKey,
      claimValue: claim.claimValue,
      visibility: ClaimVisibility.RESTRICTED,
    }));

    return this.verificationService.approve(user, {
      verificationRequestId: request.id,
      credentialType,
      approvedClaims,
      reason: body?.reason || 'Approved by federation reviewer',
    });
  }

  @Post(':id/reject')
  @AuditAction('verification.rejected')
  @Roles(UserRole.FEDERATION, UserRole.ADMIN)
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body?: { reason?: string },
  ) {
    return this.verificationService.reject(user, {
      verificationRequestId: id,
      reason: body?.reason || 'Rejected by federation reviewer',
    });
  }
}
