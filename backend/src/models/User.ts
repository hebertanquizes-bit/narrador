import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
