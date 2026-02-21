import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspaceAsset extends Document {
  _id: string;
  workspaceId: string;
  userId: string;
  type: "system_rules" | "adventure" | "bestiary" | "map" | "token_pack" | "custom_material";
  name: string;
  description?: string;
  fileName: string;
  filePath: string; // /uploads/{userId}/{filename}
  fileSize: number;
  mimeType: string;
  
  storageLocation: "local_server" | "local_browser" | "google_drive" | "dropbox";
  cloudFileId?: string;
  
  tags: string[];
  version?: string;
  author?: string;
  
  isIndexed: boolean;
  vectorStoreNamespace?: string;
  
  uploadedAt: Date;
  updatedAt: Date;
}

const workspaceAssetSchema = new Schema<IWorkspaceAsset>(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["system_rules", "adventure", "bestiary", "map", "token_pack", "custom_material"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    storageLocation: {
      type: String,
      enum: ["local_server", "local_browser", "google_drive", "dropbox"],
      default: "local_server",
    },
    cloudFileId: String,
    tags: [String],
    version: String,
    author: String,
    isIndexed: {
      type: Boolean,
      default: false,
    },
    vectorStoreNamespace: String,
  },
  { timestamps: true }
);

export const WorkspaceAsset = mongoose.model<IWorkspaceAsset>("WorkspaceAsset", workspaceAssetSchema);
