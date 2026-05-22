# Implementation Plan: AthleteShield Frontend

## Overview

This implementation plan breaks down the AthleteShield frontend into discrete, incremental coding tasks. The approach follows a bottom-up strategy: establishing core infrastructure first (project setup, API client, authentication), then building shared UI components, followed by feature-specific implementations for each user role, and finally integration and testing. Each task builds on previous work to ensure no orphaned code.

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - Initialize Next.js 14+ project with TypeScript and App Router
  - Configure Tailwind CSS with custom design system tokens
  - Set up ESLint, Prettier, and TypeScript strict mode
  - Install core dependencies: axios, zustand, react-query, react-hook-form, zod
  - Create directory structure as specified in design
  - Configure environment variables for API URL
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. API Client and Authentication Infrastructure
  - [x] 2.1 Implement API client with Axios
    - Create ApiClient class with request/response interceptors
    - Implement HTTP methods: get, post, put, delete
    - Implement uploadFile method with progress tracking
    - Configure baseURL and timeout from environment variables
    - Enable withCredentials for cookie-based auth
    - _Requirements: 1.1, 1.2, 17.5_
  
  - [x] 2.2 Implement token refresh mechanism
    - Add 401 response interceptor
    - Implement refresh token logic with request queuing
    - Handle concurrent requests during refresh
    - Redirect to login on refresh failure
    - _Requirements: 1.2, 1.3, 17.1, 17.2, 17.3, 17.4_
  
  - [ ]* 2.3 Write property test for token refresh
    - **Property 1: Token Refresh on Expiration**
    - **Property 2: Concurrent Token Refresh Deduplication**
    - **Validates: Requirements 1.2, 1.3, 17.1, 17.2, 17.3, 17.4**
  
  - [x] 2.4 Create auth store with Zustand
    - Define AuthStore interface with user, isAuthenticated, isLoading
    - Implement login, logout, refreshToken, checkAuth actions
    - Implement setUser, setAuthenticated, setLoading, reset actions
    - Configure store persistence if needed
    - _Requirements: 1.1, 1.4, 1.6_
  
  - [x] 2.5 Create notification store with Zustand
    - Define NotificationStore interface
    - Implement addNotification, markAsRead, markAllAsRead actions
    - Implement fetchNotifications action
    - Track unreadCount
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_
  
  - [x] 2.6 Create UI store with Zustand
    - Define UIStore interface
    - Implement mobile menu toggle
    - Implement modal open/close actions
    - _Requirements: 14.1, 14.2_


- [x] 3. TypeScript Type Definitions
  - Create types/index.ts with all interfaces and enums
  - Define User, AuthTokens, AuthState types
  - Define AthleteProfile, Document, DocumentType, VerificationStatus types
  - Define VerificationRequest, RequestStatus types
  - Define Credential, CredentialStatus types
  - Define AbuseReport, ReportStatus, ReportSeverity, Evidence types
  - Define AuditLog, SystemMetrics, TimeSeriesData types
  - Define FederationMember, MemberStatus types
  - Define Notification, NotificationType types
  - Define ApiResponse, PaginatedResponse, ApiError types
  - _Requirements: All requirements depend on proper type definitions_

- [x] 4. Validation Schemas with Zod
  - Create lib/validations/auth.ts with login and register schemas
  - Create lib/validations/profile.ts with athlete profile schema
  - Create lib/validations/document.ts with file upload validation
  - Create lib/validations/verification.ts with verification request schema
  - Create lib/validations/report.ts with abuse report schema
  - Create lib/validations/member.ts with federation member schema
  - Include email format, password strength (min 8 chars), required fields validation
  - Include file type (PDF, JPG, PNG) and size (max 10MB) validation
  - _Requirements: 2.5, 5.6, 15.3_

- [ ]* 4.1 Write property test for input validation
  - **Property 7: Input Validation Rules**
  - **Validates: Requirements 2.5, 5.6, 15.3**

- [-] 5. Base UI Components
  - [x] 5.1 Create Button component
    - Implement variants: primary, secondary, danger, ghost
    - Implement sizes: sm, md, lg
    - Add loading state with spinner
    - Add disabled state
    - Add icon support
    - _Requirements: 15.5, 16.2_
  
  - [x] 5.2 Create Input component
    - Support types: text, email, password, number
    - Add label and error message display
    - Add required indicator
    - Add disabled state
    - Add icon support
    - _Requirements: 15.1, 15.2_
  
  - [x] 5.3 Create Select component
    - Implement dropdown with options
    - Add label and error message
    - Add required indicator
    - Add disabled state
    - Add search functionality for long lists
    - _Requirements: 2.6, 6.1_
  
  - [x] 5.4 Create Textarea component
    - Implement multi-line text input
    - Add label and error message
    - Add character count
    - Add resize control
    - _Requirements: 10.4_
  
  - [x] 5.5 Create FileUpload component
    - Implement drag-and-drop zone with react-dropzone
    - Add file type and size validation
    - Add preview for images
    - Add progress bar
    - Add remove file button
    - _Requirements: 5.2, 5.3, 5.6, 10.5_
  
  - [x] 5.6 Create Modal component
    - Implement overlay background
    - Add close button
    - Add header, body, footer sections
    - Implement keyboard navigation (ESC to close)
    - Implement focus trap
    - _Requirements: 7.4, 19.1_
  
  - [-] 5.7 Create Toast notification component
    - Implement variants: success, error, warning, info
    - Add auto-dismiss after timeout
    - Add manual dismiss button
    - Implement queue for multiple toasts
    - Position at top-right
    - _Requirements: 16.3, 16.4_
  
  - [ ] 5.8 Create LoadingSpinner component
    - Implement sizes: sm, md, lg
    - Add color variants
    - Support centered or inline positioning
    - _Requirements: 16.1_
  
  - [ ] 5.9 Create SkeletonLoader component
    - Implement variants for text, image, card
    - Add animated shimmer effect
    - _Requirements: 16.5_
  
  - [ ] 5.10 Create Badge component
    - Implement status indicators
    - Add color variants for different statuses
    - Implement sizes: sm, md, lg
    - _Requirements: 6.4, 8.3, 11.2_
  
  - [ ] 5.11 Create Card component
    - Implement container with shadow
    - Add header, body, footer sections
    - Add hover effects
    - _Requirements: 8.2, 12.2_
  
  - [ ] 5.12 Create Table component
    - Implement responsive table
    - Add sortable columns
    - Add pagination
    - Add row selection
    - Add empty state
    - _Requirements: 5.7, 13.2, 21.4_
  
  - [ ] 5.13 Create Pagination component
    - Implement page number buttons
    - Add previous/next buttons
    - Add page size selector
    - Display total count
    - _Requirements: 13.4_

- [ ]* 5.14 Write property tests for UI components
  - **Property 56: Keyboard Navigation Support**
  - **Property 60: Focus Indicators**
  - **Validates: Requirements 19.1, 19.6**

- [ ] 6. Authentication Pages and Components
  - [ ] 6.1 Create LoginForm component
    - Implement email and password input fields
    - Add client-side validation with Zod
    - Implement submit handler calling API client
    - Add error display for invalid credentials
    - Add loading state during submission
    - Add "Remember me" option
    - Add link to registration page
    - _Requirements: 1.1_
  
  - [ ] 6.2 Create RegisterForm component
    - Implement input fields: email, password, confirmPassword, name
    - Add role selection dropdown with descriptions
    - Add password strength indicator
    - Implement client-side validation
    - Implement submit handler calling API client
    - Add success redirect to login
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  
  - [ ]* 6.3 Write property test for form validation
    - **Property 6: Form Validation Error Display**
    - **Property 8: API Validation Error Mapping**
    - **Validates: Requirements 2.4, 15.1, 15.2, 15.4**
  
  - [ ] 6.4 Create login page at app/(auth)/login/page.tsx
    - Render LoginForm component
    - Add privacy policy and terms of service links
    - Implement responsive layout
    - _Requirements: 1.1, 18.5_
  
  - [ ] 6.5 Create register page at app/(auth)/register/page.tsx
    - Render RegisterForm component
    - Add privacy policy and terms of service links
    - Implement responsive layout
    - _Requirements: 2.1, 18.5_

- [ ] 7. Route Protection and Middleware
  - [ ] 7.1 Create Next.js middleware for route protection
    - Implement middleware.ts in src root
    - Check authentication status for protected routes
    - Verify Access_Token on every request
    - Redirect unauthenticated users to login
    - Allow public routes without authentication
    - _Requirements: 3.1, 3.6_
  
  - [ ] 7.2 Implement role-based authorization in middleware
    - Check user role against route permissions
    - Redirect unauthorized users to role-appropriate home
    - Display access denied message
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 7.3 Write property tests for route protection
    - **Property 3: Unauthenticated Route Protection**
    - **Property 4: Role-Based Route Authorization**
    - **Validates: Requirements 3.1, 3.2, 3.6**

- [ ] 8. Layout and Navigation Components
  - [ ] 8.1 Create Navigation component
    - Implement responsive design (mobile hamburger, desktop sidebar)
    - Add role-based menu items
    - Add active route highlighting
    - Add user profile dropdown
    - Add logout button
    - Add notification badge with count
    - _Requirements: 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 20.4_
  
  - [ ] 8.2 Create MobileNav component
    - Implement hamburger menu icon
    - Create slide-out drawer
    - Add touch-optimized menu items
    - Close drawer on route navigation
    - _Requirements: 14.1_
  
  - [ ] 8.3 Create RootLayout component
    - Provide global context providers (auth, notifications, UI)
    - Include Navigation component
    - Render role-specific navigation
    - Include toast notification container
    - _Requirements: 1.6, 14.3_
  
  - [ ]* 8.4 Write property tests for navigation
    - **Property 9: Role-Based Navigation Display**
    - **Property 10: Active Navigation Highlighting**
    - **Validates: Requirements 14.3, 14.5, 14.6, 14.7, 14.8**

- [ ] 9. Checkpoint - Core Infrastructure Complete
  - Verify all base components render correctly
  - Verify API client handles requests and token refresh
  - Verify authentication flow works (login, logout, token refresh)
  - Verify route protection redirects unauthenticated users
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 10. Athlete Portal - Profile Management
  - [ ] 10.1 Create ProfileForm component
    - Implement personal info section: name, DOB, nationality, contact
    - Implement sport details section: sport, discipline, level, achievements
    - Add editable fields with save button
    - Add loading state while fetching/saving
    - Add success/error feedback
    - Add validation for required fields
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 10.2 Create profile page at app/(athlete)/profile/page.tsx
    - Fetch athlete profile data on page load
    - Render ProfileForm component
    - Handle profile update submissions
    - Display privacy information about data storage
    - _Requirements: 4.1, 4.2, 18.2_
  
  - [ ]* 10.3 Write property tests for profile management
    - **Property 11: Profile Update Feedback**
    - **Property 12: Profile Update Error Preservation**
    - **Validates: Requirements 4.2, 4.6**

- [ ] 11. Athlete Portal - Document Management
  - [ ] 11.1 Create DocumentUpload component
    - Implement drag-and-drop file upload zone
    - Add file type validation (PDF, JPG, PNG)
    - Add file size validation (max 10MB)
    - Display upload progress bar
    - Add document type selection dropdown
    - Display encryption indicator message
    - _Requirements: 5.2, 5.3, 5.6, 18.1_
  
  - [ ] 11.2 Create DocumentList component
    - Implement table/grid view of uploaded documents
    - Display columns: filename, type, upload date, status
    - Add click to preview/download functionality
    - Add filter by document type
    - Add sort by date
    - Add delete button with confirmation
    - _Requirements: 5.1, 5.7, 5.8_
  
  - [ ] 11.3 Create DocumentPreview modal component
    - Implement PDF viewer for PDF files
    - Implement image viewer for JPG/PNG
    - Add download button
    - Add close button
    - _Requirements: 5.8, 7.5_
  
  - [ ] 11.4 Create documents page at app/(athlete)/documents/page.tsx
    - Fetch and display document list
    - Render DocumentUpload component
    - Render DocumentList component
    - Handle file upload with progress tracking
    - Handle upload success/failure feedback
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 11.5 Write property tests for document management
    - **Property 13: File Upload with Encryption Headers**
    - **Property 14: File Upload Progress Display**
    - **Property 15: File Upload Success Handling**
    - **Property 16: File Upload Failure Handling**
    - **Property 17: Document Metadata Display**
    - **Property 18: Document Click Action**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.7, 5.8**

- [ ] 12. Athlete Portal - Verification Requests
  - [ ] 12.1 Create VerificationRequestForm component
    - Add federation selection dropdown
    - Add document attachment checklist
    - Add verification claims textarea
    - Add submit button
    - Display success message with tracking ID
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [ ] 12.2 Create VerificationRequestList component
    - Display list of athlete's verification requests
    - Show status badges: PENDING, APPROVED, REJECTED
    - Add click to view details
    - Add filter by status
    - Add sort by date
    - _Requirements: 6.4, 6.6_
  
  - [ ] 12.3 Create verifications page at app/(athlete)/verifications/page.tsx
    - Render VerificationRequestForm component
    - Render VerificationRequestList component
    - Handle verification request submission
    - Handle status updates
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
  
  - [ ]* 12.4 Write property tests for verification requests
    - **Property 19: Verification Request Submission**
    - **Property 20: Verification Request Success Confirmation**
    - **Property 21: Verification Request Status Display**
    - **Property 22: Verification Status Change UI Update**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.6**

- [ ] 13. Athlete Portal - Credentials
  - [ ] 13.1 Create CredentialCard component
    - Display credential details
    - Show status badge: ACTIVE, EXPIRED, REVOKED
    - Display issuer information
    - Display issue and expiration dates
    - Add "Generate QR Code" button (if active)
    - Add download as PDF button
    - _Requirements: 8.2, 8.3, 8.4, 8.6_
  
  - [ ] 13.2 Create QRCodeDisplay component
    - Generate QR code from credential token using qrcode.react
    - Display QR code image
    - Add share button
    - Add download QR code button
    - Add instructions for scanning
    - _Requirements: 8.5_
  
  - [ ] 13.3 Create credentials page at app/(athlete)/credentials/page.tsx
    - Fetch and display all issued credentials
    - Render CredentialCard for each credential
    - Handle QR code generation
    - Separate active, expired, and revoked credentials
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 13.4 Implement revoked credential display
    - Add visual distinction for revoked credentials
    - Display revocation reason and date
    - Display revoked credentials separately
    - Show full revocation details on click
    - Disable QR code generation for revoked credentials
    - Display appeal process information
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_
  
  - [ ]* 13.5 Write property tests for credentials
    - **Property 28: Credential Details Display**
    - **Property 29: Credential Status Display**
    - **Property 30: Active Credential QR Button**
    - **Property 31: QR Code Generation**
    - **Property 32: Credential Download and Share**
    - **Property 77: Revoked Credential Visual Distinction**
    - **Property 78: Revoked Credential Details Display**
    - **Property 81: Revoked Credential QR Restriction**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6, 24.1, 24.2, 24.5**

- [ ] 14. Athlete Portal - Abuse Reports
  - [ ] 14.1 Create athlete reports page at app/(athlete)/reports/page.tsx
    - Fetch reports where athlete is subject
    - Display report details: incident date, status, investigation stage
    - Hide reporter identity and sensitive investigation details
    - Allow click to view full details
    - Allow submission of responses or evidence
    - Display resolution outcomes for closed investigations
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_
  
  - [ ]* 14.2 Write property tests for athlete reports
    - **Property 74: Athlete Report Details Display**
    - **Property 75: Athlete Report Click Action**
    - **Property 76: Closed Investigation Resolution Display**
    - **Validates: Requirements 23.2, 23.4, 23.6**

- [ ] 15. Athlete Portal - Dashboard
  - [ ] 15.1 Create athlete dashboard page at app/(athlete)/dashboard/page.tsx
    - Display summary cards: pending verifications, active credentials, documents uploaded
    - Display recent activity feed
    - Display quick actions: upload document, request verification
    - Display notifications
    - _Requirements: 14.5_

- [ ] 16. Checkpoint - Athlete Portal Complete
  - Verify athlete can manage profile
  - Verify athlete can upload and view documents
  - Verify athlete can request verification
  - Verify athlete can view credentials and generate QR codes
  - Verify athlete can view reports where they are subject
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 17. Federation Portal - Verification Review
  - [ ] 17.1 Create VerificationRequestCard component
    - Display athlete name and profile summary
    - Display request date and status
    - Display attached documents list
    - Display verification claims
    - Add Approve/Reject buttons
    - Open document preview modal on click
    - _Requirements: 7.2, 7.5_
  
  - [ ] 17.2 Create RejectionModal component
    - Add textarea for rejection reason
    - Add cancel and confirm buttons
    - Add validation for required reason
    - _Requirements: 7.4_
  
  - [ ] 17.3 Create verification dashboard at app/(federation)/verification-requests/page.tsx
    - Fetch and display all pending verification requests
    - Render VerificationRequestCard for each request
    - Handle approve action
    - Handle reject action with reason prompt
    - Display success message and remove from pending list
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_
  
  - [ ]* 17.4 Write property tests for verification review
    - **Property 23: Verification Request Details Display**
    - **Property 24: Verification Approval Action**
    - **Property 25: Verification Rejection Action**
    - **Property 26: Document Preview Display**
    - **Property 27: Verification Action Completion**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6**

- [ ] 18. Federation Portal - Member Management
  - [ ] 18.1 Create MemberList component
    - Display table of federation members
    - Show columns: name, email, role, status, join date
    - Add "Add member" button
    - Add "Remove member" button with confirmation
    - Add filter by status
    - _Requirements: 21.1, 21.4, 21.5_
  
  - [ ] 18.2 Create AddMemberForm component
    - Add email input
    - Add role selection
    - Add invitation message textarea
    - Add send invitation button
    - _Requirements: 21.2_
  
  - [ ] 18.3 Create members page at app/(federation)/members/page.tsx
    - Fetch and display all federation members
    - Render MemberList component
    - Render AddMemberForm component
    - Handle member addition
    - Handle member removal
    - Display success/error feedback
    - _Requirements: 21.1, 21.2, 21.3, 21.6_
  
  - [ ]* 18.4 Write property tests for member management
    - **Property 68: Federation Member Addition**
    - **Property 69: Federation Member Removal**
    - **Property 70: Federation Member Details Display**
    - **Property 71: Federation Member Filtering**
    - **Property 72: Member Management Action Feedback**
    - **Validates: Requirements 21.2, 21.3, 21.4, 21.5, 21.6**

- [ ] 19. Federation Portal - Dashboard
  - [ ] 19.1 Create federation dashboard at app/(federation)/dashboard/page.tsx
    - Display summary cards: pending requests, approved verifications, active members
    - Display recent verification requests
    - Display quick actions: review request, add member
    - _Requirements: 14.6_

- [ ] 20. Checkpoint - Federation Portal Complete
  - Verify federation can view and review verification requests
  - Verify federation can approve/reject requests with reasons
  - Verify federation can manage members
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Admin/Investigator Portal - Report Management
  - [ ] 21.1 Create ReportCard component
    - Display report summary information
    - Show status badge
    - Show severity indicator
    - Display assigned investigator
    - Add click to view details
    - Add assign/reassign button
    - _Requirements: 12.1, 12.2_
  
  - [ ] 21.2 Create ReportDetails component
    - Display full incident description
    - Display evidence files list
    - Display investigation timeline
    - Add status update dropdown
    - Add assign investigator dropdown
    - Add save changes button
    - _Requirements: 12.2, 12.3, 12.4_
  
  - [ ] 21.3 Create reports dashboard at app/(admin)/reports/page.tsx
    - Fetch and display all abuse reports
    - Render ReportCard for each report
    - Add filtering: status, date range, assigned investigator, severity
    - Add sorting options
    - Display report metrics: total, pending, resolved
    - Handle report assignment
    - Handle status updates
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ]* 21.4 Write property tests for report management
    - **Property 42: Admin Report Details Display**
    - **Property 43: Report Assignment Action**
    - **Property 44: Report Status Update Action**
    - **Validates: Requirements 12.2, 12.3, 12.4**

- [ ] 22. Admin Portal - Audit Logs
  - [ ] 22.1 Create AuditLogTable component
    - Display paginated table of audit logs
    - Show columns: timestamp, user, action, resource, IP, result
    - Add filter controls: date range, user, action type, resource type
    - Add export button (CSV/JSON)
    - Add click row to view details
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 22.2 Create AuditLogDetails modal component
    - Display full log entry details
    - Show request/response data
    - Show user agent information
    - Add close button
    - _Requirements: 13.5_
  
  - [ ] 22.3 Create audit logs page at app/(admin)/audit-logs/page.tsx
    - Fetch and display audit logs
    - Render AuditLogTable component
    - Handle filtering and pagination
    - Handle export functionality
    - _Requirements: 13.1, 13.2, 13.3, 13.6_
  
  - [ ]* 22.4 Write property tests for audit logs
    - **Property 45: Audit Log Entry Display**
    - **Property 46: Audit Log Pagination**
    - **Property 47: Audit Log Entry Details**
    - **Validates: Requirements 13.2, 13.4, 13.5**

- [ ] 23. Admin Portal - Metrics Dashboard
  - [ ] 23.1 Create MetricCard component
    - Display single metric value
    - Show trend indicator (up/down)
    - Show comparison to previous period
    - Add icon representing metric type
    - _Requirements: 22.2_
  
  - [ ] 23.2 Create TimeSeriesChart component
    - Implement line chart using Recharts
    - Add responsive design
    - Add tooltip on hover
    - Add legend
    - Add axis labels
    - _Requirements: 22.3_
  
  - [ ] 23.3 Create metrics dashboard at app/(admin)/metrics/page.tsx
    - Fetch system metrics from Backend_API
    - Display summary cards: total users by role, active verifications, issued credentials, pending reports
    - Display time-series charts: daily registrations, verification requests, report submissions
    - Add date range filter
    - Add auto-refresh every 60 seconds
    - Display system health indicators: API, database, queue status
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_
  
  - [ ]* 23.4 Write property test for metrics filtering
    - **Property 73: Metrics Date Range Filtering**
    - **Validates: Requirements 22.4**

- [ ] 24. Admin Portal - Dashboard
  - [ ] 24.1 Create admin dashboard at app/(admin)/dashboard/page.tsx
    - Display summary cards: total reports, pending investigations, audit log entries
    - Display recent reports
    - Display system health status
    - Display quick actions: view reports, view audit logs, view metrics
    - _Requirements: 14.7_

- [ ] 25. Checkpoint - Admin/Investigator Portal Complete
  - Verify admin can view and manage all reports
  - Verify admin can assign reports to investigators
  - Verify admin can view audit logs with filtering
  - Verify admin can view system metrics
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 26. Public Features - Abuse Report Submission
  - [ ] 26.1 Create AbuseReportForm component
    - Add incident description textarea
    - Add date picker
    - Add location input
    - Add involved parties input
    - Add evidence file upload (multiple files)
    - Add anonymous submission checkbox
    - Add submit button
    - Display privacy notice explaining anonymity guarantees
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 18.4_
  
  - [ ] 26.2 Create report submission page at app/(public)/report/page.tsx
    - Render AbuseReportForm component
    - Handle report submission without authentication
    - Display success message with public tracking ID
    - Handle submission failure with error preservation
    - _Requirements: 10.1, 10.2, 10.3, 10.6_
  
  - [ ]* 26.3 Write property tests for abuse report submission
    - **Property 35: Anonymous Report Submission**
    - **Property 36: Report Submission Success**
    - **Validates: Requirements 10.2, 10.3**

- [ ] 27. Public Features - Report Tracking
  - [ ] 27.1 Create ReportTrackingForm component
    - Add public tracking ID input
    - Add submit button
    - Display report status
    - Display status timeline
    - No authentication required
    - _Requirements: 11.1, 11.6_
  
  - [ ] 27.2 Create report tracking page at app/(public)/track/page.tsx
    - Render ReportTrackingForm component
    - Fetch and display report status
    - Display status: SUBMITTED, UNDER_REVIEW, INVESTIGATING, RESOLVED, CLOSED
    - Display status update timestamps
    - Hide reporter identity and sensitive details
    - Handle invalid tracking ID with error message
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 27.3 Write property tests for report tracking
    - **Property 37: Report Tracking Lookup**
    - **Property 38: Report Status Display**
    - **Property 39: Report Status Timestamps**
    - **Property 40: Report Privacy Protection**
    - **Property 41: Invalid Tracking ID Error**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 28. Public Features - QR Code Verification
  - [ ] 28.1 Create QRScanner component
    - Implement camera access for QR scanning using html5-qrcode
    - Add manual token entry option
    - Display scan result
    - Display verification status
    - Handle invalid codes with error messages
    - _Requirements: 9.1, 9.5_
  
  - [ ] 28.2 Create CredentialVerificationDisplay component
    - Display athlete name
    - Display issuing federation
    - Display issue date
    - Display verification status
    - Display trust indicators
    - _Requirements: 9.3_
  
  - [ ] 28.3 Create QR verification page at app/(public)/verify-qr/page.tsx
    - Render QRScanner component
    - Handle QR token verification without authentication
    - Render CredentialVerificationDisplay on success
    - Display error message on failure
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 28.4 Write property tests for QR verification
    - **Property 33: Valid QR Verification**
    - **Property 34: Invalid QR Verification**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 29. Public Features - Home Page
  - [ ] 29.1 Create home page at app/page.tsx
    - Display platform overview and value proposition
    - Add call-to-action buttons: Register, Login, Report Abuse, Verify QR
    - Display trust indicators and security messaging
    - Add links to privacy policy and terms of service
    - Implement responsive design
    - _Requirements: 14.4, 18.5_

- [ ] 30. Checkpoint - Public Features Complete
  - Verify anonymous users can submit abuse reports
  - Verify anyone can track reports with public ID
  - Verify anyone can scan and verify QR codes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 31. Notification System Implementation
  - [ ] 31.1 Create notification API endpoints integration
    - Implement fetchNotifications function
    - Implement markAsRead function
    - Implement markAllAsRead function
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [ ] 31.2 Create NotificationBadge component
    - Display notification count
    - Update on new notifications
    - Display on navigation items
    - _Requirements: 20.4_
  
  - [ ] 31.3 Create NotificationDropdown component
    - Display list of notifications
    - Show notification title and message
    - Add click to navigate to relevant page
    - Mark as read on click
    - Add "Mark all as read" button
    - _Requirements: 20.5_
  
  - [ ] 31.4 Implement notification triggers
    - Trigger notification on verification status change
    - Trigger notification on new verification request
    - Trigger notification on report assignment
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [ ]* 31.5 Write property tests for notifications
    - **Property 62: Verification Status Change Notification**
    - **Property 63: New Verification Request Notification**
    - **Property 64: Report Assignment Notification**
    - **Property 65: Notification Count Badge**
    - **Property 66: Notification Click Action**
    - **Property 67: Notification Persistence**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6**

- [ ] 32. Loading States and User Feedback
  - [ ] 32.1 Implement loading states across all data fetches
    - Add loading indicators to all pages fetching data
    - Add skeleton loaders for content loading
    - Add loading states to all form submit buttons
    - _Requirements: 16.1, 16.2, 16.5_
  
  - [ ] 32.2 Implement success and error feedback
    - Add success toasts for all successful operations
    - Add error toasts for all failed operations
    - Configure auto-dismiss for success messages (3 seconds)
    - Configure manual dismiss for error messages
    - _Requirements: 16.3, 16.4_
  
  - [ ]* 32.3 Write property tests for loading and feedback
    - **Property 48: Loading Indicator Display**
    - **Property 49: Success Message Display**
    - **Property 50: Error Message Display**
    - **Property 51: Form Submit Button Disable**
    - **Property 52: Network Error Handling**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 15.5, 15.6**

- [ ] 33. Privacy and Security UI Elements
  - [ ] 33.1 Add privacy messaging throughout application
    - Add encryption indicator on document upload
    - Add privacy information on profile page
    - Add anonymity explanation on abuse report form
    - Add data retention information on relevant pages
    - _Requirements: 18.1, 18.2, 18.4, 18.6_
  
  - [ ] 33.2 Add trust indicators
    - Add verified badges for credentials
    - Add security icons for encrypted uploads
    - Add encryption status indicators
    - _Requirements: 18.3_
  
  - [ ]* 33.3 Write property tests for privacy UI
    - **Property 54: Document Upload Encryption Message**
    - **Property 55: Trust Indicators Display**
    - **Validates: Requirements 18.1, 18.3, 18.6**

- [ ] 34. Accessibility Implementation
  - [ ] 34.1 Add ARIA attributes to all components
    - Add ARIA labels to all interactive elements
    - Add ARIA roles to semantic sections
    - Add ARIA live regions for dynamic content
    - Add ARIA descriptions for complex interactions
    - _Requirements: 19.2_
  
  - [ ] 34.2 Implement keyboard navigation
    - Ensure all interactive elements are keyboard accessible
    - Add focus indicators to all focusable elements
    - Implement keyboard shortcuts for common actions
    - Ensure proper tab order
    - _Requirements: 19.1, 19.6_
  
  - [ ] 34.3 Implement screen reader announcements
    - Announce form errors to screen readers
    - Announce success/error messages
    - Announce loading states
    - Announce navigation changes
    - _Requirements: 19.7_
  
  - [ ] 34.4 Ensure color contrast compliance
    - Verify all text meets 4.5:1 contrast ratio
    - Adjust colors if needed
    - Test with contrast checking tools
    - _Requirements: 19.3_
  
  - [ ] 34.5 Add text alternatives
    - Add alt text to all images
    - Add labels to all icons
    - Add captions to charts
    - _Requirements: 19.4_
  
  - [ ]* 34.6 Write property tests for accessibility
    - **Property 56: Keyboard Navigation Support**
    - **Property 57: ARIA Attributes**
    - **Property 58: Color Contrast Compliance**
    - **Property 59: Text Alternatives**
    - **Property 60: Focus Indicators**
    - **Property 61: Form Error Announcements**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.6, 19.7**

- [ ] 35. Responsive Design Implementation
  - [ ] 35.1 Implement mobile-responsive layouts
    - Add mobile breakpoints to all pages
    - Optimize navigation for mobile (hamburger menu)
    - Optimize tables for mobile (card view)
    - Optimize forms for mobile (stacked layout)
    - Test on various screen sizes
    - _Requirements: 14.1, 14.2_
  
  - [ ] 35.2 Test responsive behavior
    - Test at 320px (mobile)
    - Test at 768px (tablet)
    - Test at 1024px (desktop)
    - Test at 1920px (large desktop)
    - Verify no horizontal scroll
    - Verify all content accessible
    - _Requirements: 14.1, 14.2_

- [ ] 36. Error Boundary Implementation
  - [ ] 36.1 Create ErrorBoundary component
    - Implement React Error Boundary
    - Display fallback UI for crashed components
    - Log errors to console in development
    - Add "Reload" button to recover
    - Prevent entire app crash from component errors
    - _Requirements: Error handling strategy_
  
  - [ ] 36.2 Wrap application with ErrorBoundary
    - Add ErrorBoundary to root layout
    - Add ErrorBoundary to major feature sections
    - Test error boundary with intentional errors
    - _Requirements: Error handling strategy_

- [ ] 37. Final Integration and Testing
  - [ ] 37.1 Integration testing for complete user flows
    - Test athlete registration → login → profile → document upload → verification request → credential view
    - Test federation login → verification review → approve/reject → member management
    - Test admin login → report management → audit logs → metrics
    - Test public abuse report → tracking
    - Test public QR verification
    - _Requirements: All requirements_
  
  - [ ]* 37.2 End-to-end testing with Playwright
    - Write E2E tests for authentication flow
    - Write E2E tests for athlete verification workflow
    - Write E2E tests for federation approval workflow
    - Write E2E tests for abuse report submission and tracking
    - Write E2E tests for QR code generation and verification
    - _Requirements: All requirements_
  
  - [ ]* 37.3 Accessibility testing
    - Run automated accessibility tests with axe-core
    - Test with screen readers (NVDA, JAWS, VoiceOver)
    - Test keyboard-only navigation
    - Test with browser zoom at 200%
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_
  
  - [ ]* 37.4 Cross-browser testing
    - Test on Chrome
    - Test on Firefox
    - Test on Safari
    - Test on Edge
    - Verify responsive design on all browsers
    - _Requirements: All requirements_
  
  - [ ]* 37.5 Performance testing
    - Measure page load times
    - Test with large datasets (many documents, credentials, reports)
    - Verify infinite scroll/pagination performance
    - Test file upload with large files
    - Optimize if needed
    - _Requirements: All requirements_

- [ ] 38. Documentation and Deployment Preparation
  - [ ] 38.1 Create README.md
    - Document project setup instructions
    - Document environment variables
    - Document development commands
    - Document testing commands
    - Document deployment process
    - _Requirements: All requirements_
  
  - [ ] 38.2 Create .env.example
    - List all required environment variables
    - Provide example values
    - Document each variable's purpose
    - _Requirements: All requirements_
  
  - [ ] 38.3 Configure production build
    - Optimize bundle size
    - Enable production optimizations
    - Configure error logging for production
    - Test production build locally
    - _Requirements: All requirements_

- [ ] 39. Final Checkpoint - Complete Application
  - Verify all user roles can access their respective portals
  - Verify all features work end-to-end
  - Verify all tests pass (unit, property, integration, E2E)
  - Verify accessibility compliance
  - Verify responsive design on all devices
  - Verify performance meets requirements
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration and E2E tests validate complete user workflows
- The implementation follows a bottom-up approach: infrastructure → shared components → feature-specific components → integration
- All code should be written in TypeScript with strict type checking
- All components should be accessible (WCAG 2.1 AA compliant)
- All API calls should handle loading, success, and error states
- All forms should have client-side validation before submission
