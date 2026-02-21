# 📚 Narrador Phase 1 - Comprehensive Developer Guide

**Complete reference for understanding and working with Narrador Phase 1 codebase**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Backend Deep Dive](#backend-deep-dive)
4. [Frontend Deep Dive](#frontend-deep-dive)
5. [API Reference](#api-reference)
6. [Database Guide](#database-guide)
7. [Security Guide](#security-guide)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Pages: Login, Dashboard, Workspace, Game Room       │  │
│  │  Components: AssetGrid, UploadModal, GameChat        │  │
│  │  Context: RoomContext (LocalStorage)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP + WebSocket
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (Express.js)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Routes: /api/auth, /api/workspace                   │  │
│  │  Controllers: authController, workspaceController    │  │
│  │  Services: authService, workspaceService             │  │
│  │  Middleware: auth (JWT verification)                 │  │
│  │  Socket.io: Ready for Phase 2 real-time features     │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ TCP
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  MongoDB Database                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Collections: users, workspaces, workspaceassets     │  │
│  │  Indexes: userId (for fast queries)                  │  │
│  │  TTL Indexes: (Planned for Phase 2)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

                    File Storage
                   /uploads/{userId}/
```

### Data Flow: Asset Upload

```
User clicks "Upload"
        ↓
Modal opens (Frontend)
        ↓
User selects file + metadata
        ↓
Form validated (client-side)
  - File size < 100MB?
  - MIME type allowed?
  - Asset name provided?
        ↓
POST /api/workspace/assets (multipart/form-data)
  + JWT Token
  + File + Type + Name + Description + Tags
        ↓
Backend authMiddleware
  - Verify JWT token
  - Extract userId
        ↓
multer.single('file')
  - Validate MIME type
  - Check file size
  - Create /uploads/{userId}/ directory
  - Save file to disk
        ↓
uploadAssetController
  - Get workspace for userId
  - Create WorkspaceAsset document
  - Add to workspace.assets
  - Save to MongoDB
        ↓
Response: 200 OK + Asset metadata
        ↓
Frontend updates:
  - Close modal
  - Add asset to grid
  - Update asset count
```

---

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **MongoDB**: 4.4 or higher (local or Docker)
- **npm**: 9.0 or higher
- **Git**: For version control

### Installation Steps

#### 1. Clone Repository
```bash
git clone <repo-url>
cd narrador
```

#### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
```

#### 3. Setup Frontend
```bash
cd ..
npm install
```

#### 4. Start Services

**Terminal 1: Backend**
```bash
cd backend
npm run dev
# Wait for: "✅ Conectado ao banco de dados"
```

**Terminal 2: Frontend**
```bash
npm run dev
# Wait for: "✓ Ready in XXms"
```

#### 5. Test
```bash
# Open browser
open http://localhost:3000

# Or
curl http://localhost:5000/api/health
```

---

## Backend Deep Dive

### Project Structure

```
backend/src/
├── server.ts                    # Entry point
├── config/database.ts           # MongoDB connection
├── controllers/                 # Route handlers
│   ├── authController.ts
│   └── workspaceController.ts
├── middleware/
│   └── auth.ts                  # JWT verification
├── models/                      # MongoDB schemas
│   ├── User.ts
│   ├── Workspace.ts
│   └── WorkspaceAsset.ts
├── routes/                      # Route definitions
│   ├── auth.ts
│   └── workspace.ts
├── services/                    # Business logic
│   ├── authService.ts
│   └── workspaceService.ts
└── utils/
    └── fileUpload.ts            # Multer config
```

### Key Files Explained

#### `server.ts` - Express Application Setup
```typescript
// Key responsibilities:
// 1. Initialize Express app
// 2. Configure middleware (helmet, CORS, morgan)
// 3. Setup Socket.io
// 4. Register routes
// 5. Start HTTP server
// 6. Connect to MongoDB on startup
```

#### `config/database.ts` - Database Connection
```typescript
// Export functions:
// - connectDB(): Connect to MongoDB
// - disconnectDB(): Close connection
// - checkConnection(): Verify connection
```

#### `models/User.ts` - User Schema
```typescript
interface IUser {
  email: string (unique)
  password: string (bcrypt hashed)
  name: string
  avatar?: string
  createdAt: Date (auto)
  updatedAt: Date (auto)
}

// Indexes:
// - email (unique)
// - createdAt (descending)
```

#### `models/Workspace.ts` - Workspace Schema
```typescript
interface IWorkspace {
  userId: string (indexed) // Owner of workspace
  name: string
  assets: ObjectId[]
  storageProvider?: string
  iaProvider?: string
  createdAt: Date (auto)
  updatedAt: Date (auto)
}

// Indexes:
// - userId (for fast lookups)
// - createdAt (for sorting)
```

#### `models/WorkspaceAsset.ts` - Asset Schema
```typescript
interface IWorkspaceAsset {
  workspaceId: ObjectId
  userId: string (indexed) // For user isolation
  type: "adventure" | "bestiary" | "system" | "item" | "npc" | "map"
  name: string
  filePath: string ("uploads/{userId}/{filename}")
  fileSize: number
  mimeType: string
  tags: string[]
  uploadedAt: Date (auto)
}

// Indexes:
// - userId (critical for security)
// - workspaceId
// - uploadedAt (for sorting)
```

#### `middleware/auth.ts` - JWT Verification
```typescript
// Function: authMiddleware
// 1. Extract token from Authorization header
// 2. Verify JWT signature
// 3. Check expiration
// 4. Attach userId to req.userId
// 5. Pass to next middleware or return 401

// Checks:
// - Token format: "Bearer {token}"
// - Token expiration: 7 days
// - Valid signature: using JWT_SECRET from .env
```

#### `services/authService.ts` - Authentication Logic
```typescript
// registerUser(email, password, name)
//   1. Check if email exists
//   2. Hash password with bcrypt
//   3. Create user document
//   4. Generate JWT token
//   5. Return user + token

// loginUser(email, password)
//   1. Find user by email
//   2. Compare password hash
//   3. Generate JWT token
//   4. Return user + token
```

#### `services/workspaceService.ts` - Workspace Logic
```typescript
// createWorkspace(userId, name)
//   - Create or update workspace
//   - Auto-create on first use
//   - Return workspace object

// getWorkspace(userId)
//   - Query: Workspace.findOne({ userId })
//   - Populate asset references
//   - Return workspace or null

// uploadAsset(userId, file, metadata)
//   - Get/create workspace
//   - Save file to disk
//   - Create WorkspaceAsset document
//   - Add to workspace.assets
//   - Return asset metadata

// deleteAsset(assetId, userId)
//   - Verify ownership (asset.userId === userId)
//   - Delete file from disk
//   - Remove document from MongoDB
//   - Update workspace references
```

### Request/Response Examples

#### Register User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "narrator@example.com",
  "password": "secure_password_123",
  "name": "John Narrator"
}

Response: 201 Created
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "narrator@example.com",
    "name": "John Narrator"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Upload Asset
```bash
POST http://localhost:5000/api/workspace/assets
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [PDF file]
type: "adventure"
name: "Lost Cavern Campaign"
description: "A mysterious cavern filled with ancient ruins"
tags: "fantasy,dungeon,mystical"

Response: 200 OK
{
  "asset": {
    "_id": "507f1f77bcf86cd799439012",
    "workspaceId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439010",
    "type": "adventure",
    "name": "Lost Cavern Campaign",
    "fileName": "campaign.pdf",
    "filePath": "uploads/507f1f77bcf86cd799439010/campaign.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "tags": ["fantasy", "dungeon", "mystical"],
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Error Handling

```typescript
// Standard error response format:
{
  error: "Error message",
  details?: { field: "value" }
}

// Common status codes:
// 400 Bad Request - Invalid input
// 401 Unauthorized - Missing/invalid token
// 403 Forbidden - User doesn't have access
// 404 Not Found - Resource doesn't exist
// 500 Internal Server Error - Unexpected error
```

---

## Frontend Deep Dive

### Pages & Routes

#### `/` (Login)
```typescript
// src/app/page.tsx
// Purpose: User authentication
// Features:
//   - Register form
//   - Login form
//   - Simulated Google OAuth (Phase 2: real OAuth)
//   - Stores token in localStorage
```

#### `/dashboard` (Room List)
```typescript
// src/app/dashboard/page.tsx
// Purpose: Manage game rooms
// Features:
//   - Create new room
//   - Join room by code
//   - List user's rooms
//   - Delete room
```

#### `/workspace` (Asset Library) - NEW in Phase 1
```typescript
// src/app/workspace/page.tsx
// Purpose: Manage assets
// Features:
//   - Upload new assets
//   - Browse asset library
//   - Delete assets
//   - Organize by type
```

#### `/sala/[id]` (Game Room)
```typescript
// src/app/sala/[id]/page.tsx
// Purpose: Active game session
// Features:
//   - Game chat interface
//   - Character sheets
//   - Campaign config
//   - Turn management
```

### Component Architecture

#### DashboardNav (Updated)
```typescript
// src/components/DashboardNav.tsx
// Provides: Navigation bar for dashboard
// Shows: Salas, Workspace, User info, Logout
// Actions: Navigate between sections
```

#### WorkspaceInterface (Workspace/Page)
```typescript
// Sections:
// 1. Header
//    - Back button
//    - Workspace name
//    - Asset count
//    - Upload button

// 2. Asset Grid
//    - Cards for each asset
//    - Type badges (color-coded)
//    - Description & tags
//    - Delete button

// 3. Upload Modal
//    - File input
//    - Asset name (required)
//    - Type dropdown
//    - Description textarea
//    - Tag input
//    - Upload/Cancel buttons
```

### State Management

```typescript
// Authentication
localStorage['narrador_auth_token'] = "JWT_TOKEN"
localStorage['narrador_user'] = JSON.stringify(user)

// Workspace
const [workspace, setWorkspace] = useState<Workspace | null>(null)
const [assets, setAssets] = useState<Asset[]>([])
const [loading, setLoading] = useState(true)
const [uploading, setUploading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [showUploadModal, setShowUploadModal] = useState(false)

// Form inputs
const [newAssetName, setNewAssetName] = useState('')
const [newAssetType, setNewAssetType] = useState('adventure')
const [newAssetDesc, setNewAssetDesc] = useState('')
const [selectedFile, setSelectedFile] = useState<File | null>(null)
```

### API Integration

```typescript
// Fetch workspace
fetch('http://localhost:5000/api/workspace/', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

// Upload asset
const formData = new FormData()
formData.append('file', selectedFile)
formData.append('type', newAssetType)
formData.append('name', newAssetName)
formData.append('description', newAssetDesc)

fetch('http://localhost:5000/api/workspace/assets', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
})

// Delete asset
fetch(`http://localhost:5000/api/workspace/assets/${assetId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
```

---

## API Reference

### Base URL
```
Development: http://localhost:5000
Production: https://api.narrador.app (Phase 2)
```

### Authentication Endpoints

#### POST /api/auth/register
Register new user account

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response** (201)
```json
{
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**
- 400: Email already registered, missing fields
- 500: Server error

#### POST /api/auth/login
Authenticate user and get token

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200)
```json
{
  "user": { "..." },
  "token": "..."
}
```

**Errors**
- 401: Invalid email/password
- 500: Server error

### Workspace Endpoints (Protected)

All workspace endpoints require:
```
Authorization: Bearer {token}
```

#### GET /api/workspace
Get user's workspace

**Response** (200)
```json
{
  "workspace": {
    "_id": "...",
    "userId": "...",
    "name": "My Workspace",
    "assets": [],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### POST /api/workspace
Create or update workspace

**Request**
```json
{
  "name": "My Workspace"
}
```

**Response** (200/201)
```json
{
  "workspace": { "..." }
}
```

#### PUT /api/workspace
Update workspace settings

**Request**
```json
{
  "name": "Updated Name",
  "iaProvider": "openai"
}
```

**Response** (200)
```json
{
  "workspace": { "..." }
}
```

### Asset Endpoints (Protected)

#### POST /api/workspace/assets
Upload new asset

**Request** (multipart/form-data)
```
file: [File object]
type: "adventure"
name: "Asset Name"
description: "Optional description"
tags: "tag1,tag2"
author: "Author Name"
```

**Response** (200)
```json
{
  "asset": {
    "_id": "...",
    "type": "adventure",
    "name": "Asset Name",
    "filePath": "uploads/.../filename",
    "fileSize": 1024000,
    "uploadedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Errors**
- 400: Missing fields, file too large
- 401: Unauthorized
- 413: File too large
- 415: Unsupported MIME type

#### GET /api/workspace/assets
List all user's assets

**Response** (200)
```json
{
  "assets": [
    { "..." },
    { "..." }
  ]
}
```

#### GET /api/workspace/assets/:id
Get single asset details

**Response** (200)
```json
{
  "asset": { "..." }
}
```

**Errors**
- 404: Asset not found or access denied

#### DELETE /api/workspace/assets/:id
Delete asset

**Response** (200)
```json
{
  "success": true,
  "message": "Asset deletado com sucesso"
}
```

**Errors**
- 404: Asset not found or access denied

---

## Database Guide

### Connection

**Local MongoDB**
```bash
mongod
```

**Docker MongoDB**
```bash
docker run -d -p 27017:27017 --name narrador-db mongo:latest
```

**Connect with CLI**
```bash
mongo mongodb://localhost:27017/narrador
```

### Queries

**Count users**
```javascript
db.users.countDocuments()
```

**Find workspace for user**
```javascript
db.workspaces.findOne({ userId: "user_id_here" })
```

**List all assets for user**
```javascript
db.workspaceassets.find({ userId: "user_id_here" }).sort({ uploadedAt: -1 })
```

**Find assets by type**
```javascript
db.workspaceassets.find({
  userId: "user_id",
  type: "adventure"
}).sort({ uploadedAt: -1 })
```

**Delete user's data** (cleanup)
```javascript
db.users.deleteOne({ _id: ObjectId("...") })
db.workspaces.deleteOne({ userId: "user_id" })
db.workspaceassets.deleteMany({ userId: "user_id" })
```

### Indexes

**Current Indexes**
- `users`: email (unique), createdAt
- `workspaces`: userId, createdAt
- `workspaceassets`: userId, workspaceId, uploadedAt

**Add custom index** (if needed)
```javascript
db.workspaceassets.createIndex({ userId: 1, type: 1 })
```

---

## Security Guide

### Authentication Flow

```
1. User registers/logs in
   ↓
2. Password hashed with bcrypt (10 rounds)
   ↓
3. User document stored in MongoDB
   ↓
4. JWT token generated (7-day expiry)
   ↓
5. Token sent to frontend
   ↓
6. Frontend stores in localStorage
   ↓
7. Token sent in Authorization header for protected requests
   ↓
8. Backend verifies JWT signature
   ↓
9. Extract userId from token
   ↓
10. Filter all queries by userId (user isolation)
```

### Password Security

```typescript
// Hashing
const hashedPassword = await bcrypt.hash(password, 10)
// 10 = salt rounds (higher = more secure, slower)

// Verification
const isValid = await bcrypt.compare(password, hashedPassword)
```

### Token Security

```typescript
// Generation
const token = jwt.sign(
  { userId, email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// Verification
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  // decoded = { userId, email, iat, exp }
} catch (err) {
  // Token expired or invalid
}
```

### User Isolation

```typescript
// ALWAYS filter by userId
const assets = await WorkspaceAsset.find({ userId })
// Never: await WorkspaceAsset.find({ workspaceId })
// This prevents users from seeing other users' assets
```

### File Security

```typescript
// Validation
const allowedMimes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/json',
]

if (!allowedMimes.includes(file.mimetype)) {
  throw new Error('Invalid file type')
}

// Size limit
const maxSize = 100 * 1024 * 1024 // 100MB
if (file.size > maxSize) {
  throw new Error('File too large')
}

// Directory isolation
const uploadPath = `uploads/${userId}/`
// Files for User A: uploads/user_a_id/file.pdf
// Files for User B: uploads/user_b_id/file.pdf
// They cannot access each other's files
```

### CORS Configuration

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// Only frontend at specified URL can call API
// Other origins blocked
```

---

## Troubleshooting

### Backend Won't Start

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**: MongoDB not running
```bash
# Check if running
ps aux | grep mongod

# Start MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 mongo:latest
```

**Error**: `Port 5000 already in use`

**Solution**: Port in use or previous server still running
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### Frontend Can't Connect

**Error**: `CORS error` or `fetch failed`

**Solution**: Backend not running or CORS misconfigured
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Update FRONTEND_URL in backend/.env
FRONTEND_URL=http://localhost:3000

# Restart backend
```

### File Upload Fails

**Error**: `413 Payload Too Large`

**Solution**: File exceeds 100MB limit
```typescript
// Check file size before uploading
console.log(file.size) // bytes
console.log(file.size / 1024 / 1024) // MB

// Max 100MB
```

**Error**: `415 Unsupported Media Type`

**Solution**: File type not in whitelist
```typescript
// Allowed types
const allowedMimes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/json',
]

// Check file.type before upload
```

### Token Expired

**Error**: `401 Token expirado`

**Solution**: Token expired (7 days)
```typescript
// User must login again
localStorage.removeItem('narrador_auth_token')
window.location.href = '/'
```

### Database Issues

**Error**: `MongoDB Timeout`

**Solution**: Check connection string
```javascript
// Correct format
mongodb://localhost:27017/narrador
mongodb+srv://user:pass@cluster.mongodb.net/narrador

// Check .env
cat backend/.env | grep MONGODB_URI
```

---

## Best Practices

### Code Organization

✅ **DO**
- Keep business logic in services
- Keep route handlers in controllers
- Keep middleware focused and reusable
- Use TypeScript strict mode
- Validate all inputs

❌ **DON'T**
- Put logic directly in controllers
- Mix routing with business logic
- Use `any` type in TypeScript
- Skip input validation
- Hardcode configuration

### Error Handling

✅ **DO**
```typescript
try {
  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json({ user })
} catch (error) {
  console.error('Error:', error)
  return res.status(500).json({ error: 'Internal server error' })
}
```

❌ **DON'T**
```typescript
// Don't expose internal errors
res.json({ error: error.message })

// Don't ignore errors
const user = await User.findById(id)

// Don't mix success/error handling
return res.json({ success: false, data: user })
```

### Security

✅ **DO**
- Always hash passwords
- Always verify JWT tokens
- Always filter by userId
- Always validate file uploads
- Use environment variables for secrets

❌ **DON'T**
- Store plain passwords
- Trust client-side validation only
- Skip server-side checks
- Log sensitive information
- Commit .env files

### Performance

✅ **DO**
- Use database indexes
- Cache frequently accessed data
- Limit query results
- Use async/await properly
- Monitor response times

❌ **DON'T**
- Query without indexes
- Load all records at once
- Make unnecessary DB calls
- Use blocking operations
- Ignore performance metrics

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial Phase 1 release |

---

## Contact & Support

- **Documentation**: See PHASE_1_SETUP.md
- **Testing Guide**: See PHASE_1_TESTING.md
- **Architecture**: See EXPANSION_PLAN.md
- **Code Guidelines**: See .github/copilot-instructions.md

---

**Last Updated**: 2024  
**Maintained By**: Narrador Development Team
