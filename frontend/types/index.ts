// User and Authentication
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: UserRole[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ATHLETE = 'ATHLETE',
  COACH = 'COACH',
  FEDERATION = 'FEDERATION',
  ADMIN = 'ADMIN',
  INVESTIGATOR = 'INVESTIGATOR',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Athlete Profile
export interface AthleteProfile {
  id: string;
  userId: string;
  athleteCode: string;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  primarySport: string | null;
  clubName: string | null;
  federationId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

// Documents
export interface Document {
  id: string;
  athleteProfileId: string;
  uploadedByUserId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  s3Bucket: string;
  s3Key: string;
  encryptionAlgorithm: string;
  encryptionIvBase64: string;
  encryptionAuthTagBase64: string;
  encryptionKeyVersion: string;
  createdAt: string;
  updatedAt: string;
}

export enum DocumentType {
  ID_PROOF = 'ID_PROOF',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  CERTIFICATE = 'CERTIFICATE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  EVIDENCE = 'EVIDENCE',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING_SCAN = 'PENDING_SCAN',
  AVAILABLE = 'AVAILABLE',
  QUARANTINED = 'QUARANTINED',
  DELETED = 'DELETED',
}

// Verification Requests
export interface VerificationRequest {
  id: string;
  athleteProfileId: string;
  federationId: string;
  requestedByUserId: string;
  status: VerificationRequestStatus;
  purpose: string;
  requestedClaims: Record<string, any>;
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum VerificationRequestStatus {
  REQUESTED = 'REQUESTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface VerificationClaim {
  id: string;
  verificationRequestId: string;
  evidenceDocumentId: string | null;
  claimKey: string;
  claimValue: any;
  status: VerificationClaimStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum VerificationClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Credentials
export interface Credential {
  id: string;
  athleteProfileId: string;
  federationId: string;
  issuedByUserId: string;
  type: CredentialType;
  status: CredentialStatus;
  payload: Record<string, any>;
  payloadHashSha256: string | null;
  signatureBase64: string | null;
  publicKeyVersion: string;
  selectiveDisclosure: Record<string, any> | null;
  issuedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum CredentialType {
  AGE_VERIFIED = 'AGE_VERIFIED',
  MEDICAL_VERIFIED = 'MEDICAL_VERIFIED',
  PARTICIPATION_VERIFIED = 'PARTICIPATION_VERIFIED',
  RANKING_VERIFIED = 'RANKING_VERIFIED',
  IDENTITY_VERIFIED = 'IDENTITY_VERIFIED',
  CUSTOM = 'CUSTOM',
}

export enum CredentialStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  SIGNED = 'SIGNED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export interface CredentialClaim {
  id: string;
  credentialId: string;
  claimKey: string;
  claimValue: any;
  visibility: ClaimVisibility;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export enum ClaimVisibility {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
  PRIVATE = 'PRIVATE',
}

// QR Sessions
export interface QRSession {
  id: string;
  credentialId: string;
  tokenHash: string;
  signedToken: string;
  allowedClaims: string[];
  status: QRSessionStatus;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum QRSessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  USED = 'USED',
}

// Abuse Reports
export interface AbuseReport {
  id: string;
  publicTrackingId: string;
  subjectAthleteId: string | null;
  assignedToUserId: string | null;
  status: ReportStatus;
  severity: ReportSeverity;
  title: string | null;
  aiSummary: string | null;
  toxicityScore: number | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export enum ReportStatus {
  SUBMITTED = 'SUBMITTED',
  TRIAGED = 'TRIAGED',
  ASSIGNED = 'ASSIGNED',
  INVESTIGATING = 'INVESTIGATING',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ReportSeverity {
  UNKNOWN = 'UNKNOWN',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ReportEvidence {
  id: string;
  reportId: string;
  evidenceType: ReportEvidenceType;
  originalFileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  checksumSha256: string | null;
  s3Bucket: string | null;
  s3Key: string | null;
  encryptionAlgorithm: string | null;
  encryptionIvBase64: string | null;
  encryptionAuthTagBase64: string | null;
  encryptionKeyVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum ReportEvidenceType {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  OTHER = 'OTHER',
}

// Audit Logs
export interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

// Metrics
export interface SystemMetrics {
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  activeVerifications: number;
  issuedCredentials: number;
  pendingReports: number;
  systemHealth: {
    apiStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    databaseStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    queueStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  };
}

export interface TimeSeriesData {
  date: string;
  registrations: number;
  verifications: number;
  reports: number;
}

// Federation Members
export interface FederationMember {
  id: string;
  federationId: string;
  userId: string;
  role: FederationMemberRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export enum FederationMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VERIFIER = 'VERIFIER',
  COACH = 'COACH',
  INVESTIGATOR = 'INVESTIGATOR',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  subject: string;
  body: string;
  metadata: Record<string, any> | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// Federation
export interface Federation {
  id: string;
  name: string;
  country: string;
  sport: string | null;
  registrationNumber: string | null;
  status: FederationStatus;
  createdAt: string;
  updatedAt: string;
}

export enum FederationStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}
