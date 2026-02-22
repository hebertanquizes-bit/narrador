/**
 * Shared TypeScript Interfaces for Phase 1
 * Used by both backend and frontend for type safety
 */

// ============= User & Authentication =============

export interface IUser {
  _id?: string;
  email: string;
  password?: string; // Only on server-side
  name: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

export interface AuthError {
  error: string;
}

// ============= Workspace =============

export interface IWorkspace {
  _id?: string;
  userId: string;
  name: string;
  assets?: string[] | IWorkspaceAsset[]; // ObjectId[] or populated
  storageProvider?: 'local_server' | 'google_drive' | 'aws_s3';
  storageConfig?: {
    googleDriveFolder?: string;
    googleDriveAccessToken?: string;
    awsS3Bucket?: string;
    awsS3Region?: string;
    awsS3AccessKeyId?: string;
    awsS3SecretAccessKey?: string;
  };
  iaProvider?: 'openai' | 'anthropic' | 'deepseek' | 'gemini';
  iaModel?: string;
  iaApiKey?: string; // Encrypted in production
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkspaceResponse {
  workspace: IWorkspace;
}

// ============= Asset Management =============

export type AssetType = 'adventure' | 'bestiary' | 'system' | 'item' | 'npc' | 'map';

export interface IWorkspaceAsset {
  _id?: string;
  workspaceId?: string;
  userId: string;
  type: AssetType;
  name: string;
  description?: string;
  fileName: string; // Original filename
  filePath: string; // Server path: uploads/{userId}/{filename}
  fileSize: number; // bytes
  mimeType: string;
  tags?: string[];
  author?: string;
  isIndexed?: boolean; // For RAG Phase 2
  vectorNamespace?: string; // Pinecone/Weaviate namespace
  storageLocation?: 'local_server' | 'google_drive' | 'aws_s3';
  uploadedAt?: Date;
  indexedAt?: Date;
}

export interface AssetListResponse {
  assets: IWorkspaceAsset[];
}

export interface AssetResponse {
  asset: IWorkspaceAsset;
}

export interface AssetUploadRequest {
  file: File; // Multipart form data
  type: AssetType;
  name: string;
  description?: string;
  tags?: string[];
  author?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// ============= API Error Responses =============

export interface ErrorResponse {
  error: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============= File Upload =============

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/json',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  adventure: 'bg-purple-900/30 border-purple-500 text-purple-200',
  bestiary: 'bg-red-900/30 border-red-500 text-red-200',
  system: 'bg-blue-900/30 border-blue-500 text-blue-200',
  item: 'bg-yellow-900/30 border-yellow-500 text-yellow-200',
  npc: 'bg-green-900/30 border-green-500 text-green-200',
  map: 'bg-indigo-900/30 border-indigo-500 text-indigo-200',
};

// ============= Request/Response Patterns =============

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============= Socket.IO Events (Phase 2) =============

export interface SocketAuthPayload {
  userId: string;
  token: string;
  workspaceId?: string;
}

export interface GameStateUpdate {
  roomId: string;
  state: Record<string, unknown>;
  updatedAt: Date;
}

export interface AssetIndexEvent {
  assetId: string;
  status: 'started' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

// ============= Utility Types =============

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// ============= Constants =============

export const JWT_EXPIRY = '7d'; // 7 days
export const BCRYPT_ROUNDS = 10;

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const API_TIMEOUT = 30000; // 30 seconds

// ============= Validation Rules =============

export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    minLength: 5,
    maxLength: 255,
    message: 'Email inválido',
  },
  password: {
    minLength: 6,
    maxLength: 128,
    message: 'Senha deve ter entre 6 e 128 caracteres',
  },
  name: {
    minLength: 2,
    maxLength: 100,
    message: 'Nome deve ter entre 2 e 100 caracteres',
  },
  assetName: {
    minLength: 1,
    maxLength: 255,
    message: 'Nome do asset deve ter entre 1 e 255 caracteres',
  },
  description: {
    maxLength: 1000,
    message: 'Descrição não pode ter mais de 1000 caracteres',
  },
  tags: {
    maxTags: 10,
    maxTagLength: 50,
    message: 'Máximo 10 tags, cada uma com até 50 caracteres',
  },
} as const;

// ============= Export Type Aliases =============

export type UserId = string;
export type AssetId = string;
export type WorkspaceId = string;
export type Token = string;