# Phase 1 Implementation Checklist

## ✅ Completed Components

### Backend Foundation
- [x] `backend/package.json` - All dependencies configured
- [x] `backend/tsconfig.json` - TypeScript strict mode enabled
- [x] `backend/.env.example` - Environment template with all required variables
- [x] `backend/src/config/database.ts` - MongoDB connection utilities
- [x] `backend/src/models/User.ts` - User schema with password hashing fields
- [x] `backend/src/models/Workspace.ts` - Workspace schema with asset references
- [x] `backend/src/models/WorkspaceAsset.ts` - Asset metadata schema (6 types, cloud storage options)
- [x] `backend/src/middleware/auth.ts` - JWT verification & userId extraction
- [x] `backend/src/utils/fileUpload.ts` - Multer config (100MB limit, MIME filtering, user directories)
- [x] `backend/src/services/authService.ts` - Register/login with bcrypt & JWT
- [x] `backend/src/services/workspaceService.ts` - Workspace CRUD & asset management
- [x] `backend/src/controllers/authController.ts` - Auth endpoint handlers
- [x] `backend/src/controllers/workspaceController.ts` - Workspace endpoint handlers (7 endpoints)
- [x] `backend/src/routes/auth.ts` - Auth route definitions
- [x] `backend/src/routes/workspace.ts` - Workspace route definitions
- [x] `backend/src/server.ts` - Express server with Socket.io setup

### Frontend - New Features
- [x] `src/app/workspace/page.tsx` - Workspace dashboard with asset grid
- [x] `src/components/DashboardNav.tsx` - Updated with "Workspace" link

### Documentation
- [x] `PHASE_1_SETUP.md` - Complete setup guide (18 sections)
- [x] `README.md` - Updated with Phase 1 info & quick start
- [x] `setup-phase1.sh` - Automated setup script (Unix/Mac)
- [x] `setup-phase1.bat` - Automated setup script (Windows)

## 🔍 Manual Testing Checklist

### Prerequisites
- [ ] MongoDB installed or Docker running
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install` in root and `backend/`)

### Backend Tests

#### 1. Server Startup
- [ ] Backend starts without errors: `cd backend && npm run dev`
- [ ] MongoDB connection successful (console shows "✅ Conectado ao banco de dados")
- [ ] Server listening on port 5000
- [ ] Socket.io ready
- [ ] Health check responds: `curl http://localhost:5000/api/health`

#### 2. Authentication Endpoints
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@narrador.com","password":"test123","name":"Test Narrator"}'

# Expected: 201 status, returns user + token
- [ ] Response includes `token` (JWT format: xxx.yyy.zzz)
- [ ] Response includes `user` object with `_id`, `email`, `name`

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@narrador.com","password":"test123"}'

# Expected: 200 status, returns user + token (same as register)
- [ ] Token valid for subsequent requests
- [ ] Wrong password returns 401 error
```

#### 3. Workspace Endpoints (Protected)
```bash
# Replace TOKEN with actual JWT from login

# Get/create workspace
curl -X GET http://localhost:5000/api/workspace/ \
  -H "Authorization: Bearer TOKEN"

- [ ] Returns workspace object on first call (auto-created)
- [ ] Returns same workspace on second call
- [ ] Without token returns 401

# Update workspace name
curl -X PUT http://localhost:5000/api/workspace/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Custom Workspace"}'

- [ ] Returns updated workspace
- [ ] Name changed in database
```

#### 4. Asset Upload Endpoint
```bash
# Create test file
echo "Test PDF content" > test.txt

# Upload
curl -X POST http://localhost:5000/api/workspace/assets \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.txt" \
  -F "type=adventure" \
  -F "name=Test Adventure" \
  -F "description=A test asset" \
  -F "tags=test,demo"

- [ ] Returns 200 status
- [ ] Asset object includes all fields
- [ ] File exists in `/uploads/{userId}/`
- [ ] File has correct size
- [ ] Tags parsed correctly (array)
```

#### 5. Asset List & Delete
```bash
# List assets
curl -X GET http://localhost:5000/api/workspace/assets \
  -H "Authorization: Bearer TOKEN"

- [ ] Returns array of assets
- [ ] Most recently uploaded first (sorted by uploadedAt)
- [ ] Each asset has complete metadata

# Get single asset
curl -X GET http://localhost:5000/api/workspace/assets/{ASSET_ID} \
  -H "Authorization: Bearer TOKEN"

- [ ] Returns single asset details
- [ ] Invalid asset ID returns 404

# Delete asset
curl -X DELETE http://localhost:5000/api/workspace/assets/{ASSET_ID} \
  -H "Authorization: Bearer TOKEN"

- [ ] Returns 200 with success message
- [ ] File removed from /uploads/
- [ ] Asset removed from MongoDB
- [ ] Workspace.assets reference removed
- [ ] Deleted asset no longer in list
```

#### 6. Security Tests
```bash
# Wrong token
curl -X GET http://localhost:5000/api/workspace/ \
  -H "Authorization: Bearer INVALID_TOKEN"

- [ ] Returns 401 "Token inválido"

# Expired token (manually edit token expiry in code to test)
- [ ] Returns 401 "Token expirado"

# No token
curl -X GET http://localhost:5000/api/workspace/

- [ ] Returns 401 "Token não fornecido"

# User cannot access other user's assets
  1. Login as User A, get token A
  2. Login as User B, upload asset, get asset ID
  3. Login as User A, try to delete User B's asset
  - [ ] Returns 404 or access denied error
```

### Frontend Tests

#### 1. Login & Workspace Navigation
- [ ] Visit http://localhost:3000
- [ ] Register new account with email/password
- [ ] Account created (check localStorage: `narrador_auth_token`)
- [ ] Redirected to dashboard
- [ ] Click "Workspace" link in navigation
- [ ] Workspace page loads
- [ ] Shows "0 assets na biblioteca"

#### 2. Asset Upload
- [ ] Click "Enviar Asset" button
- [ ] Modal opens
- [ ] Select a test file (PDF, PNG, TXT, MD, or JSON)
- [ ] Modal shows selected filename
- [ ] Enter asset name (required)
- [ ] Select asset type from dropdown
- [ ] Enter description (optional)
- [ ] Click "Enviar Asset"
- [ ] "Enviando..." button state shows
- [ ] File upload completes
- [ ] Modal closes
- [ ] Asset appears in grid

#### 3. Asset Display
- [ ] Asset shows correct type badge (color-coded)
- [ ] Asset shows icon matching type
- [ ] Asset shows name, description, tags
- [ ] Asset shows file name, size in MB, upload date
- [ ] Delete button appears in top-right
- [ ] Asset grid responsive (1 col mobile, 2-3 cols desktop)

#### 4. Asset Management
- [ ] Upload 3+ different asset types
- [ ] Assets appear in correct order (newest first)
- [ ] Filter by asset type visibility
- [ ] Click delete button on one asset
- [ ] Confirmation dialog appears
- [ ] Click confirm
- [ ] Asset removed from list
- [ ] Asset count updated in header

#### 5. Error Handling
- [ ] Try uploading file >100MB: error message
- [ ] Try uploading unsupported file type (.exe, .zip): error message
- [ ] Try submitting without file selected: button disabled
- [ ] Try submitting without asset name: error message
- [ ] Try accessing workspace without authentication: redirected to login

#### 6. Browser Storage
- [ ] Check LocalStorage in DevTools:
  - [ ] `narrador_auth_token` contains JWT
  - [ ] `narrador_user` contains user info
- [ ] Refresh page
- [ ] User remains logged in
- [ ] Assets reload from backend

#### 7. Dashboard Integration
- [ ] Navigate to Dashboard (Salas)
- [ ] Navigate back to Workspace
- [ ] Both pages accessible
- [ ] Navigation menu shows both links
- [ ] Logout button works from both pages

### Database Tests

#### MongoDB Verification
```bash
# Connect to MongoDB
mongo

# List databases
show databases

# Use narrador database
use narrador

# Check collections
show collections

# Count documents
db.users.countDocuments()
db.workspaces.countDocuments()
db.workspaceassets.countDocuments()

# Verify data structure
db.users.findOne()
db.workspaces.findOne()
db.workspaceassets.findOne()

- [ ] User doc has email, password (hashed), name
- [ ] Workspace doc has userId, name, assets array
- [ ] Asset doc has all required fields
- [ ] Passwords are bcrypt hashes (not plain text!)
```

### File System Tests

#### Upload Directory
```bash
# Check uploads directory exists
ls -la backend/uploads/

# Check user directory
ls -la backend/uploads/{USER_ID}/

# Verify files exist
file backend/uploads/{USER_ID}/*

- [ ] Directory created per user
- [ ] Files uploaded with original names preserved
- [ ] File permissions readable by server
- [ ] Deleted assets remove files from disk
```

## 🐛 Known Issues & Notes

- **MongoDB URI**: Default is `mongodb://localhost:27017/narrador`. Update in `.env` if using remote DB.
- **CORS**: Frontend at `http://localhost:3000`, backend at `http://localhost:5000`. Both must be running.
- **File Uploads**: Currently stored on local server disk (`/uploads/`). In production, implement S3/Cloud Storage.
- **JWT Secret**: Use strong random string in production (`.env` JWT_SECRET).
- **Socket.io**: Ready for Phase 2 multiplayer features (game state sync, etc).

## 📋 What to Test Next (Phase 2 Preview)

- **RAG Integration**: Upload PDF → extract text → create embeddings → query with context
- **Real-time Updates**: Socket.io events when assets uploaded/deleted
- **Cloud Storage**: Google Drive/S3 file upload + retrieval
- **Advanced Queries**: Filter/search assets by type, tags, date range
- **Batch Operations**: Multi-select assets, bulk delete/export

## ✨ Validation Sign-Off

After completing all tests above, Phase 1 is validated:

- **Backend**: Express + MongoDB + File upload working ✅
- **Frontend**: Asset management UI functional ✅
- **Security**: User isolation + JWT auth + file validation ✅
- **Documentation**: Complete setup guide + API docs ✅

Ready to proceed with Phase 2 features!

---

**Last Updated**: 2024  
**Phase 1 Status**: Ready for Testing  
**Estimated Completion**: ~1-2 hours (including all manual tests)
