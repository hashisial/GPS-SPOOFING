import env from "../config/env.js";

const defaultWindowMs = 15 * 60 * 1000;

const createRateLimiter = ({ windowMs = defaultWindowMs, limit, message, keyPrefix }) => {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      current.count += 1;
      buckets.set(key, current);
    }

    const activeBucket = buckets.get(key);
    const remaining = Math.max(limit - activeBucket.count, 0);

    res.setHeader("RateLimit-Limit", limit);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", Math.ceil(activeBucket.resetAt / 1000));

    if (activeBucket.count > limit) {
      return res.status(429).json({ message });
    }

    next();
  };
};

export const apiRateLimiter = createRateLimiter({
  limit: env.apiRateLimitMax,
  keyPrefix: "api",
  message: "Too many requests. Please try again later."
});

export const authRateLimiter = createRateLimiter({
  limit: env.authRateLimitMax,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please try again later."
});

export const reportRateLimiter = createRateLimiter({
  limit: env.reportRateLimitMax,
  keyPrefix: "reports",
  message: "Too many report export requests. Please try again later."
});
