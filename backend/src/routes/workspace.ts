import { Router } from "express";
import * as workspaceController from "../controllers/workspaceController";
import { authMiddleware } from "../middleware/auth";
import { uploadMiddleware } from "../utils/fileUpload";

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

// Workspace profile routes
router.get("/", workspaceController.getWorkspaceController);
router.post("/", workspaceController.createWorkspaceController);
router.put("/", workspaceController.updateWorkspaceController);

// Asset management routes
router.post(
  "/assets",
  uploadMiddleware.single("file"),
  workspaceController.uploadAssetController
);
router.get("/assets", workspaceController.listAssetsController);
router.get("/assets/:id", workspaceController.getAssetController);
router.delete("/assets/:id", workspaceController.deleteAssetController);

export default router;
