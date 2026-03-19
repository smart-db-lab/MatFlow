import { z } from "zod";

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters"),
});

// Register Schema
export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters long")
      .max(100, "First name must be less than 100 characters"),
    last_name: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters long")
      .max(100, "Last name must be less than 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .max(255, "Email must be less than 255 characters"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must be less than 128 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    terms_accepted: z
      .boolean()
      .refine((value) => value, {
        message: "Please accept the Terms and Conditions.",
      }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

