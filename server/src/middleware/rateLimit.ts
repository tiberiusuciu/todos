import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

const noop: RequestHandler = (_req, _res, next) => next();

function createLimiter(options: Parameters<typeof rateLimit>[0]): RequestHandler {
  if (process.env.NODE_ENV !== "production") return noop;
  return rateLimit(options);
}

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, try again later" },
});

export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, try again later" },
});
