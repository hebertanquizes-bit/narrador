import { Workspace, IWorkspace } from "../models/Workspace";
import { WorkspaceAsset, IWorkspaceAsset } from "../models/WorkspaceAsset";
import path from "path";
import fs from "fs-extra";

export async function createWorkspace(userId: string, name: string): Promise<IWorkspace> {
  let workspace = await Workspace.findOne({ userId });

  if (workspace) {
    // Update existing
    workspace.name = name;
    await workspace.save();
  } else {
    // Create new
    workspace = new Workspace({
      userId,
      name,
      assets: [],
    });
    await workspace.save();
  }

  return workspace;
}

export async function getWorkspace(userId: string): Promise<IWorkspace | null> {
  return Workspace.findOne({ userId }).populate("assets");
}

export async function updateWorkspaceConfig(
  userId: string,
  config: Partial<IWorkspace>
): Promise<IWorkspace | null> {
  return Workspace.findOneAndUpdate({ userId }, config, { new: true });
}

export async function uploadAsset(
  userId: string,
  file: Express.Multer.File,
  assetData: {
    type: string;
    name: string;
    description?: string;
    tags?: string[];
    author?: string;
  }
): Promise<IWorkspaceAsset> {
  // Get or create workspace
  let workspace = await Workspace.findOne({ userId });
  if (!workspace) {
    workspace = await createWorkspace(userId, "Meu Workspace");
  }

  const filePath = `uploads/${userId}/${file.filename}`;

  // Create asset
  const asset = new WorkspaceAsset({
    workspaceId: workspace._id,
    userId,
    type: assetData.type,
    name: assetData.name,
    description: assetData.description,
    fileName: file.originalname,
    filePath,
    fileSize: file.size,
    mimeType: file.mimetype,
    tags: assetData.tags || [],
    author: assetData.author,
    isIndexed: false,
  });

  await asset.save();

  // Add to workspace
  workspace.assets.push(asset._id as any);
  await workspace.save();

  return asset;
}

export async function getWorkspaceAssets(userId: string): Promise<IWorkspaceAsset[]> {
  return WorkspaceAsset.find({ userId }).sort({ uploadedAt: -1 });
}

export async function deleteAsset(assetId: string, userId: string): Promise<boolean> {
  const asset = await WorkspaceAsset.findById(assetId);

  if (!asset || asset.userId !== userId) {
    throw new Error("Asset não encontrado ou acesso negado");
  }

  // Delete file
  if (asset.storageLocation === "local_server") {
    const filePath = path.join(process.cwd(), asset.filePath);
    await fs.remove(filePath);
  }

  // Delete from DB
  await WorkspaceAsset.deleteOne({ _id: assetId });

  // Remove from workspace
  await Workspace.updateOne(
    { _id: asset.workspaceId },
    { $pull: { assets: assetId } }
  );

  return true;
}

export async function getAssetById(assetId: string, userId: string): Promise<IWorkspaceAsset | null> {
  const asset = await WorkspaceAsset.findById(assetId);

  if (!asset || asset.userId !== userId) {
    return null;
  }

  return asset;
}
