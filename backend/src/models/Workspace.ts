import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspace extends Document {
  _id: string;
  userId: string;
  name: string;
  avatar?: string;
  bio?: string;
  assets: string[]; // WorkspaceAsset IDs
  
  storageConfig: {
    localEnabled: boolean;
    googleDriveLinked: boolean;
    dropboxLinked: boolean;
    cloudFolderPath?: string;
  };
  
  aiConfig: {
    provider?: "openai" | "anthropic" | "deepseek" | "local";
    apiKeyEncrypted?: string;
    model?: string;
  };
  
  defaultSystem?: string;
  preferredLanguage: "pt-BR" | "en-US" | "es-ES";
  
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: String,
    bio: String,
    assets: [String],
    storageConfig: {
      localEnabled: {
        type: Boolean,
        default: true,
      },
      googleDriveLinked: {
        type: Boolean,
        default: false,
      },
      dropboxLinked: {
        type: Boolean,
        default: false,
      },
      cloudFolderPath: String,
    },
    aiConfig: {
      provider: {
        type: String,
        enum: ["openai", "anthropic", "deepseek", "local"],
        default: "local",
      },
      apiKeyEncrypted: String,
      model: String,
    },
    defaultSystem: String,
    preferredLanguage: {
      type: String,
      enum: ["pt-BR", "en-US", "es-ES"],
      default: "pt-BR",
    },
  },
  { timestamps: true }
);

export const Workspace = mongoose.model<IWorkspace>("Workspace", workspaceSchema);
