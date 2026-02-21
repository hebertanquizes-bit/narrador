"use client";

import { STORAGE_KEYS, getItem, setItem, removeItem } from "./storage";
import type { User } from "./types";

// Declare Google Identity type
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, options: any) => void;
        };
      };
    };
  }
}

export function getCurrentUser(): User | null {
  return getItem<User>(STORAGE_KEYS.USER);
}

export function setCurrentUser(user: User): void {
  setItem(STORAGE_KEYS.USER, user);
}

export function logout(): void {
  removeItem(STORAGE_KEYS.USER);
}

export async function registerWithEmail(email: string, password: string, name: string): Promise<User> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao criar conta");
    }

    const data = await response.json();
    
    // Após registro bem-sucedido, fazer login automático
    return loginWithEmail(email, password);
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao fazer login");
    }

    const data = await response.json();
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      provider: "email",
      token: data.token,
    };
    setCurrentUser(user);
    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/** Google OAuth login com Google Identity Services */
export async function loginWithGoogle(): Promise<void> {
  try {
    // Inicializa Google Identity Services
    await new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      document.head.appendChild(script);
    });

    // Usa a callback do Google Identity
    window.google?.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1234567890-abc123def456ghi789jklmno@apps.googleusercontent.com",
      callback: handleGoogleLogin,
    });

    // Render o botão de login do Google
    window.google?.accounts.id.renderButton(
      document.getElementById("google-login-btn") || document.body,
      { theme: "dark", size: "large" }
    );
  } catch (error) {
    console.error("Google login error:", error);
  }
}

async function handleGoogleLogin(response: any) {
  try {
    // Decodificar JWT response
    const credentialJwt = response.credential;
    const base64Url = credentialJwt.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const googleUser = JSON.parse(jsonPayload);

    // Enviar para backend para criar/atualizar usuário
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response2 = await fetch(`${apiUrl}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: credentialJwt,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      }),
    });

    if (!response2.ok) {
      const error = await response2.json();
      throw new Error(error.error || "Erro ao fazer login com Google");
    }

    const data = await response2.json();
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      provider: "google",
      token: data.token,
      avatar: data.user.avatar,
    };
    setCurrentUser(user);
  } catch (error) {
    console.error("Google login callback error:", error);
  }}