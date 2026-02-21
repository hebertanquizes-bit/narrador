# Narrador - Phase 1: Workspace + Asset Upload 

## 📋 Overview

**Phase 1** implements the foundational infrastructure for the Narrador VTT platform:
- **Backend**: Express.js + MongoDB + Socket.io server
- **Frontend**: Workspace management UI + Asset upload component
- **Authentication**: JWT-based auth with user isolation
- **Storage**: Local file uploads with user-based directory isolation

## 🎯 What's Included

### Backend (`/backend/`)

#### Core Services
- **`authService.ts`**: User registration, login, JWT token generation
- **`workspaceService.ts`**: Workspace CRUD, asset management, file operations
- **`database.ts`**: MongoDB connection helper

#### Controllers
- **`authController.ts`**: Route handlers for auth endpoints
- **`workspaceController.ts`**: Route handlers for workspace & asset endpoints

#### Routes
- **`routes/auth.ts`**: `/api/auth/register`, `/api/auth/login`
- **`routes/workspace.ts`**: Workspace and asset management endpoints

#### Models (MongoDB Schemas)
- **`User.ts`**: User document with email, password (hashed), name
- **`Workspace.ts`**: User's workspace with asset references
- **`WorkspaceAsset.ts`**: Asset metadata (file path, type, tags, size)

#### Middleware
- **`auth.ts`**: JWT verification, user isolation
- **`fileUpload.ts`**: Multer configuration for secure file uploads (100MB max)

#### Server
- **`server.ts`**: Express app setup, Socket.io integration, middleware configuration

### Frontend (`/src/`)

#### New Page
- **`app/workspace/page.tsx`**: Main workspace dashboard with asset grid

#### Updated Components
- **`DashboardNav.tsx`**: Added "Workspace" link to navigation

## 🚀 Getting Started

### 1. Install Dependencies

#### Frontend (already done)
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 2. Setup Environment Variables

#### Backend - Create `.env`
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
MONGODB_URI=mongodb://localhost:27017/narrador
JWT_SECRET=your_secret_key_here_change_in_production
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

### 3. Start MongoDB

```bash
# If you have MongoDB installed locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name narrador-db mongo:latest
```

### 4. Start the Servers

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Expected output:
```
✅ Conectado ao banco de dados
╔════════════════════════════════════════╗
║  🎭 NARRADOR - Backend Server         ║
║  Porta: 5000                        ║
║  Status: ✅ Rodando                   ║
║  Socket.IO: ✅ Pronto                 ║
╚════════════════════════════════════════╝
```

#### Terminal 2: Frontend
```bash
npm run dev
```

Visit: **http://localhost:3000**

## 📚 API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "secret",
    "name": "Narrator Name"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "secret"
  }
  ```

### Workspace (Protected)
All workspace routes require `Authorization: Bearer <token>` header.

- **GET** `/api/workspace/` - Get user's workspace
- **POST** `/api/workspace/` - Create workspace
  ```json
  { "name": "My Workspace" }
  ```

- **PUT** `/api/workspace/` - Update workspace config
- **GET** `/api/workspace/assets` - List all assets
- **POST** `/api/workspace/assets` - Upload new asset (multipart form data)
- **GET** `/api/workspace/assets/:id` - Get asset details
- **DELETE** `/api/workspace/assets/:id` - Delete asset

### Health Check
- **GET** `/api/health` - Server status

## 🔐 Data Security

### User Isolation
Every query filters by `userId` to prevent cross-user data access:
```typescript
WorkspaceAsset.find({ userId })  // Only fetch own assets
```

### File Storage
Files uploaded to: `/uploads/{userId}/`
- Automatic directory creation per user
- MIME type validation (PDF, images, text, JSON, markdown)
- 100MB file size limit
- Files deleted when asset is removed

### Authentication
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiration
- Client stores token in `localStorage['narrador_auth_token']`

## 📁 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── workspaceController.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Workspace.ts
│   │   └── WorkspaceAsset.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   └── workspace.ts
│   ├── services/
│   │   ├── authService.ts
│   │   └── workspaceService.ts
│   ├── utils/
│   │   └── fileUpload.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧪 Testing Workflow

### 1. Test Registration & Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get token from response and use in next requests
```

### 2. Test Workspace
```bash
# Get workspace
curl -X GET http://localhost:5000/api/workspace/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create workspace
curl -X POST http://localhost:5000/api/workspace/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Workspace"}'
```

### 3. Test File Upload
```bash
# Upload asset
curl -X POST http://localhost:5000/api/workspace/assets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "type=adventure" \
  -F "name=My Adventure" \
  -F "description=A great adventure" \
  -F "tags=fantasy,dungeon"
```

### 4. Frontend Testing
1. Navigate to **http://localhost:3000**
2. Register new account
3. Go to **Dashboard** → **Workspace**
4. Click **"Enviar Asset"**
5. Upload a file (PDF, PNG, etc)
6. Verify asset appears in grid
7. Click delete and confirm removal

## 🔄 Data Flow

```
User Registration
├─ POST /api/auth/register
├─ Hash password with bcrypt
├─ Store user in MongoDB
└─ Return JWT token

User Login
├─ POST /api/auth/login
├─ Verify email & password
├─ Generate JWT token (7-day expiration)
└─ Return token + user info

Asset Upload
├─ POST /api/workspace/assets (multipart form)
├─ Verify JWT token → Extract userId
├─ Validate file (size, MIME type)
├─ Save to /uploads/{userId}/
├─ Create MongoDB WorkspaceAsset document
├─ Return asset metadata
└─ Add asset reference to Workspace

Asset Listing
├─ GET /api/workspace/assets
├─ Verify JWT token → Extract userId
├─ Query: WorkspaceAsset.find({ userId })
└─ Return sorted assets (newest first)

Asset Deletion
├─ DELETE /api/workspace/assets/:id
├─ Verify userId owns asset
├─ Delete file from /uploads/{userId}/
├─ Remove from MongoDB
└─ Update Workspace references
```

## 🚨 Common Issues & Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure MongoDB is running
```bash
# Check if mongod is running
ps aux | grep mongod

# Or start Docker version
docker run -d -p 27017:27017 mongo:latest
```

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS
```
**Solution**: Update `FRONTEND_URL` in backend `.env`
```env
FRONTEND_URL=http://localhost:3000
```

### File Upload Fails
**Check**:
- File size < 100MB
- MIME type in allowed list (PDF, PNG, JPEG, WebP, TXT, MD, JSON)
- Authentication token is valid
- `multipart/form-data` header is set (Fetch API handles automatically)

### Token Expired
```
{error: "Token expirado"}
```
**Solution**: User must login again. Token is valid for 7 days.

## 📊 Database Schema

### User
```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  name: string,
  avatar?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Workspace
```typescript
{
  _id: ObjectId,
  userId: string (indexed),
  name: string,
  assets: ObjectId[], // References to WorkspaceAsset
  storageProvider?: string, // "local_server" | "google_drive" | "aws_s3"
  storageConfig?: {
    googleDriveFolder?: string,
    awsS3Bucket?: string
  },
  iaProvider?: string,
  iaModel?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### WorkspaceAsset
```typescript
{
  _id: ObjectId,
  workspaceId: ObjectId,
  userId: string (indexed),
  type: string, // "adventure" | "bestiary" | "system" | "item" | "npc" | "map"
  name: string,
  description?: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  tags: string[],
  author?: string,
  isIndexed: boolean, // For future RAG integration
  vectorNamespace?: string, // For Pinecone/Weaviate
  storageLocation: string, // "local_server" | "google_drive" | "aws_s3"
  uploadedAt: Date
}
```

## 🔜 Next Steps (Phase 2)

After Phase 1 is stable, Phase 2 will add:
- **RAG Integration**: LangChain.js + vector database (Pinecone/Weaviate)
- **Combat Grid**: Konva.js canvas with token movement
- **Co-Narrator AI Chat**: Separate channel for game prep
- **Multi-Provider AI**: OpenAI, Anthropic, Deepseek support with cost estimation
- **Real-time Sync**: Socket.io events for campaign updates
- **Cloud Storage**: Google Drive, Dropbox, AWS S3 integration

## 📝 License

Part of the Narrador VTT project.
