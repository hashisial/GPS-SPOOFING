import { jwt } from "./vendor.js";
import { env } from "../config/env.js";
import { TOKEN_TYPES } from "../constants/auth.js";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: TOKEN_TYPES.ACCESS
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.jwtAccessTtl
    }
  );
}

export function signRefreshToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: TOKEN_TYPES.REFRESH,
      sessionId
    },
    env.jwtRefreshSecret,
    {
      expiresIn: env.jwtRefreshTtl
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

export function decodeToken(token) {
  return jwt.decode(token);
}

