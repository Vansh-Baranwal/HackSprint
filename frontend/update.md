# Simulation Mode — Latest Changes

## Overview
The backend now runs in *simulation mode* — no real AI verification, no federation workflow. Athletes upload documents and get a QR instantly. After 30 seconds the QR becomes "verified" automatically.

---

## New/Changed Endpoints

### 1. POST /athlete/documents (Auth: ATHLETE)
Upload a document. Now returns a QR token alongside the document info.

json
{
  "document": {
    "id": "uuid",
    "documentType": "ID_PROOF",
    "status": "AVAILABLE",
    "originalFileName": "passport.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": "123456",
    "createdAt": "2026-05-22T..."
  },
  "qr": {
    "token": "random-64-char-hex-token",
    "status": "pending",
    "message": "QR will be ready for verification in 30 seconds"
  }
}


*What to do:* Store the qr.token on the frontend. Show the QR code (as a data URL or barcode) to the athlete.

### 2. GET /qr/verify/:token (Public)
Anyone can scan/verify a QR token without authentication.

*Before 30 seconds elapse:*
json
{
  "status": "pending",
  "message": "QR will be ready for verification in 5 seconds",
  "athlete": {
    "athleteCode": "AS-XXXX",
    "primarySport": "Swimming"
  },
  "document": { "id": "uuid", "type": "ID_PROOF" },
  "verified": false
}


*After 30 seconds:*
json
{
  "status": "verified",
  "message": "Athlete verified successfully",
  "verifiedAt": "2026-05-22T12:00:30.000Z",
  "athlete": {
    "athleteCode": "AS-XXXX",
    "primarySport": "Swimming",
    "name": "John Doe",
    "email": "athlete@example.com"
  },
  "document": { "id": "uuid", "type": "ID_PROOF" },
  "reports": [
    {
      "id": "ASR-XXXXXXXX",
      "title": "Suspicious activity",
      "status": "SUBMITTED",
      "severity": "MEDIUM",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "verified": true,
  "signatureValid": true
}


*What to do (Frontend):*
1. After upload, show the QR code with a *countdown timer* (30s).
2. Poll GET /qr/verify/:token every 2–3 seconds.
3. When status becomes "verified", hide the timer and show *"Verified"* with a green checkmark.
4. Show athlete info and any linked reports below.

### 3. GET /admin/reports (Auth: ADMIN, INVESTIGATOR)
List all open abuse/complaint reports.

### 4. PATCH /admin/reports/:id/status (Auth: ADMIN, INVESTIGATOR)
Update a report's status.

json
{
  "status": "INVESTIGATING",
  "reason": "Reviewing evidence"
}


### 5. POST /reports/anonymous (Public)
File an anonymous abuse report (unchanged).

---

## Removed / Simplified

### Federation selection removed
- POST /verification/request no longer requires federationId in the request body.
- GET /federations is now *public* (no auth needed).
- POST /federations (create federation) has been removed.

### Admin simplified
- Removed audit logs endpoint.
- Removed report assignment endpoint.
- Kept only: list reports + update status.

---

## Flow Summary


Athlete uploads document
        │
        ▼
POST /athlete/documents
  → Returns { document, qr: { token, status: "pending" } }
        │
        ▼  (30 seconds pass)
        │
Investigator/anyone scans QR
GET /qr/verify/:token
  → Returns { status: "verified", athlete, documents, reports[] }


## Environment
- REDIS_URL is now *optional* (defaults to redis://localhost:6379). App works without Redis for basic testing.
- Redis is still required for QR storage. Without it, QR generation will fail silently.