import { Request, Response, NextFunction } from "express";
import * as workspaceService from "../services/workspaceService";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// GET /api/workspace - Retrieve user's workspace
export async function getWorkspaceController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const workspace = await workspaceService.getWorkspace(userId);

    if (!workspace) {
      return res.status(404).json({ error: "Workspace não encontrado" });
    }

    res.json({ workspace });
  } catch (error) {
    next(error);
  }
}

// POST /api/workspace - Create or update workspace
export async function createWorkspaceController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Nome do workspace é obrigatório" });
    }

    const workspace = await workspaceService.createWorkspace(userId, name);

    res.json({ workspace });
  } catch (error) {
    next(error);
  }
}

// PUT /api/workspace - Update workspace configuration
export async function updateWorkspaceController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const workspace = await workspaceService.updateWorkspaceConfig(userId, updateData);

    if (!workspace) {
      return res.status(404).json({ error: "Workspace não encontrado" });
    }

    res.json({ workspace });
  } catch (error) {
    next(error);
  }
}

// POST /api/workspace/assets - Upload asset file
export async function uploadAssetController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não fornecido" });
    }

    const { type, name, description, tags, author } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: "Tipo e nome do asset são obrigatórios" });
    }

    if (!req.userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    const parsedTags = tags ? (typeof tags === "string" ? tags.split(",") : tags) : [];

    const asset = await workspaceService.uploadAsset(req.userId, req.file, {
      type,
      name,
      description,
      tags: parsedTags,
      author,
    });

    res.json({ asset });
  } catch (error) {
    next(error);
  }
}

// GET /api/workspace/assets - List user's assets
export async function listAssetsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const assets = await workspaceService.getWorkspaceAssets(userId);

    res.json({ assets });
  } catch (error) {
    next(error);
  }
}

// GET /api/workspace/assets/:id - Get single asset details
export async function getAssetController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const asset = await workspaceService.getAssetById(id, userId);

    if (!asset) {
      return res.status(404).json({ error: "Asset não encontrado" });
    }

    res.json({ asset });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/workspace/assets/:id - Delete asset
export async function deleteAssetController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const success = await workspaceService.deleteAsset(id, userId);

    if (!success) {
      return res.status(404).json({ error: "Asset não encontrado ou acesso negado" });
    }

    res.json({ success: true, message: "Asset deletado com sucesso" });
  } catch (error) {
    next(error);
  }
}
