import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(email: string, password: string, name: string) {
  // Validate email
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Email inválido");
  }

  // Validate password
  if (password.length < 6) {
    throw new Error("Senha deve ter no mínimo 6 caracteres");
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email já registrado");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({
    email,
    password: hashedPassword,
    name,
  });

  await user.save();
  return { id: user._id, email: user.email, name: user.name };
}

export async function loginUser(email: string, password: string) {
  // Validate email format
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Email ou senha inválidos");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Email ou senha inválidos");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Email ou senha inválidos");
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  };
}
export async function googleLogin(email: string, name: string, picture?: string) {
  // Validate email
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Email inválido");
  }

  // Find or create user
  let user = await User.findOne({ email });
  
  if (!user) {
    // Create new user with Google login (no password required)
    user = new User({
      email,
      name,
      avatar: picture,
      password: "", // Google users don't have a password
    });
    await user.save();
  } else {
    // Update avatar if provided
    if (picture && !user.avatar) {
      user.avatar = picture;
      await user.save();
    }
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  };
}