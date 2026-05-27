import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { getCookieOptions, requireAuth, signToken } from "../middleware/auth.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimit.js";
import { isRegistrationCodeValid, isRegistrationRequired } from "../utils/registration.js";

const router = Router();

const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) return null;
  return password;
}

router.post("/register", registerLimiter, async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body.email);
  const password = validatePassword(req.body.password);

  if (!email) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (!password) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }

  if (isRegistrationRequired() && !isRegistrationCodeValid(req.body.registrationCode)) {
    res.status(403).json({ error: "Invalid invite code" });
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });

  const authUser = { id: user._id.toString(), email: user.email };
  res.cookie("token", signToken(authUser), getCookieOptions());
  res.status(201).json(authUser);
});

router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body.email);
  const password = validatePassword(req.body.password);

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const authUser = { id: user._id.toString(), email: user.email };
  res.cookie("token", signToken(authUser), getCookieOptions());
  res.json(authUser);
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json(req.user);
});

export default router;
