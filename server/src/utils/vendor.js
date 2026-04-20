import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const bcrypt = require("bcryptjs");
export const compression = require("compression");
export const cookieParser = require("cookie-parser");
export const cors = require("cors");
export const dotenv = require("dotenv");
export const express = require("express");
export const helmet = require("helmet");
export const { StatusCodes } = require("http-status-codes");
export const jwt = require("jsonwebtoken");
export const mongoose = require("mongoose");
export const pino = require("pino");
export const pinoHttp = require("pino-http");
export const rateLimit = require("express-rate-limit");
export const { Server } = require("socket.io");
export const { z, ZodError } = require("zod");
export const { Router } = express;
