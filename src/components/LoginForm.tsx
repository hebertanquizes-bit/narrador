"use client";

import { useState } from "react";
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "@/lib/supabase/auth";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Erro desconhecido";
}

export default function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotFound, setEmailNotFound] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isValidEmail = () => EMAIL_REGEX.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailNotFound(false);
    setLoading(true);

    try {
      if (isRegistering) {
        // Validar email
        if (!isValidEmail()) {
          setError("Email inválido");
          setLoading(false);
          return;
        }

        // Validar senhas
        if (password !== confirmPassword) {
          setError("As senhas não conferem");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Senha deve ter no mínimo 6 caracteres");
          setLoading(false);
          return;
        }

        // Registrar novo usuário
        // registerWithEmail já define o role como 'player' automaticamente
        try {
          await registerWithEmail(email, password, email.split("@")[0]);
          // Hard redirect: middleware relê sessão fresca e redireciona corretamente
          // Como novo usuário já tem role=player, vai direto para o dashboard
          window.location.href = '/dashboard';
        } catch (err: unknown) {
          const errorMsg = getErrorMessage(err).toLowerCase();
          if (errorMsg.includes("user already registered") || errorMsg.includes("already registered")) {
            setError("Este email já possui uma conta. Tente fazer login.");
          } else if (errorMsg.includes("signup") || errorMsg.includes("sign up") || errorMsg.includes("disabled")) {
            setError("Cadastro desabilitado. Ative 'Enable sign ups' em Authentication → Settings no Supabase.");
          } else if (errorMsg.includes("password") || errorMsg.includes("weak")) {
            setError("Senha muito fraca. Use ao menos 6 caracteres com letras e números.");
          } else {
            setError(getErrorMessage(err) || "Erro ao criar conta");
          }
          setLoading(false);
        }
      } else {
        // Login
        if (!isValidEmail()) {
          setError("Email inválido");
          setLoading(false);
          return;
        }

        try {
          await loginWithEmail(email, password);
          // Hard redirect para garantir que o middleware releia os cookies com sessão fresca
          // O middleware verificará o role e redirecionará adequadamente:
          // - role=player ou role=narrator → /dashboard
          // - sem role → /workspace/selecionar (não deve ocorrer em usuários novos)
          window.location.href = '/dashboard';
        } catch (err: unknown) {
          const errorMsg = getErrorMessage(err);

          // Supabase retorna mensagens em inglês
          if (
            errorMsg.toLowerCase().includes("invalid login credentials") ||
            errorMsg.toLowerCase().includes("invalid") ||
            errorMsg.includes("não encontrado")
          ) {
            setEmailNotFound(true);
            setError("Email ou senha incorretos. Verifique seus dados.");
          } else if (errorMsg.toLowerCase().includes("email not confirmed")) {
            setError("Seu email ainda não foi confirmado. Verifique sua caixa de entrada.");
          } else {
            setError(errorMsg);
          }
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Erro ao processar");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      // Google OAuth redireciona via callback, sem necessidade de redirecionamento manual
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Erro ao fazer login com Google");
      setLoading(false);
    }
  };

  return (
    <div className="panel w-full max-w-md mx-auto">
      <h1 className="text-2xl font-display font-bold text-rpg-gold mb-2 text-center">
        Narrador
      </h1>
      <p className="text-rpg-muted text-center text-sm mb-6">
        {isRegistering
          ? "Crie uma nova conta para começar"
          : "Entre para acessar suas salas e campanhas"}
      </p>

      {error && (
        <div className={`mb-4 p-3 rounded flex gap-2 ${emailNotFound
          ? "bg-blue-900/20 border border-blue-500/30 text-blue-400"
          : "bg-red-900/20 border border-red-500/30 text-red-400"
          }`}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm">{error}</span>
            {emailNotFound && !isRegistering && (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                  setEmailNotFound(false);
                }}
                className="block text-xs text-blue-300 hover:text-blue-200 mt-2 font-medium"
              >
                Clique aqui para criar uma conta →
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rpg-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailNotFound(false);
              }}
              placeholder="seu@email.com"
              className={`input-field pl-10 ${!isValidEmail() && email.length > 0 ? "border-red-500" : ""
                }`}
              required
            />
          </div>
          {!isValidEmail() && email.length > 0 && (
            <p className="text-xs text-red-400 mt-1">Email inválido</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rpg-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        {isRegistering && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rpg-muted" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10"
                required
              />
            </div>
          </div>
        )}

        {/* Aviso de role para novos usuários */}
        {isRegistering && (
          <div className="text-xs text-rpg-muted bg-blue-900/10 border border-blue-500/20 rounded p-3">
            <span className="text-blue-300 font-medium">ℹ️ Novo usuário</span>
            <br />
            Você começará como <strong className="text-blue-200">Jogador</strong>. Para se tornar Narrador, acesse o Workspace após entrar.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isRegistering ? (
            <>
              <UserPlus className="h-4 w-4" />
              {loading ? "Criando conta..." : "Criar Conta"}
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              {loading ? "Entrando..." : "Entrar"}
            </>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-rpg-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-rpg-panel px-2 text-rpg-muted">ou</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="btn-secondary w-full flex items-center justify-center gap-2 mb-3"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Entrar com Google
      </button>

      <div className="my-4 pt-4 border-t border-rpg-border">
        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
            setEmailNotFound(false);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
          }}
          className="w-full text-center text-sm font-medium px-4 py-2 rounded bg-rpg-accent/10 hover:bg-rpg-accent/20 text-rpg-accent hover:text-rpg-gold transition"
        >
          {isRegistering
            ? "← Voltar para Login"
            : "✨ Criar Nova Conta"}
        </button>
      </div>
    </div>
  );
}
