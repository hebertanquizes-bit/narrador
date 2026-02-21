import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";

// POST /api/auth/register - Register new user
export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios",
      });
    }

    // Nome é opcional - usar email como padrão
    const userName = name || email.split("@")[0];
    const result = await authService.registerUser(email, password, userName);

    if ("error" in result) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login - Login user
export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios",
      });
    }

    try {
      const result = await authService.loginUser(email, password);

      if ("error" in result) {
        return res.status(401).json(result);
      }

      res.json(result);
    } catch (error: any) {
      // Retorna erro específico do login
      return res.status(401).json({
        error: error.message || "Email ou senha inválidos",
      });
    }
  } catch (error) {
    next(error);
  }
}
// POST /api/auth/google - Google OAuth login
export async function googleLoginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, email, name, picture } = req.body;

    // Validate input
    if (!email || !token) {
      return res.status(400).json({
        error: "Email e token são obrigatórios",
      });
    }

    const result = await authService.googleLogin(email, name || email.split("@")[0], picture);

    if ("error" in result) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}