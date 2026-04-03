import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt as scryptCallback, randomBytes as randomBytesCallback } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

const scrypt = promisify(scryptCallback);
const randomBytes = promisify(randomBytesCallback);


declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  const salt = (await randomBytes(16)).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return salt + ":" + derivedKey.toString("hex");
}

async function comparePasswords(supplied: string, stored: string) {
  const [salt, key] = stored.split(":");
  const derivedKey = (await scrypt(supplied, salt, 64)) as Buffer;
  return key === derivedKey.toString("hex");
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "zdspgc-online-enrollment-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/user/update-profile", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { username, currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.sendStatus(404);

      let hashedPassword = user.password;
      let updatePw = false;
      let updateUn = false;

      // 1. Validate Password if changing
      if (newPassword || currentPassword) {
        if (!currentPassword) return res.status(400).send("Current password is required to change password.");
        if (!newPassword) return res.status(400).send("New password is required.");
        if (newPassword.length < 6) return res.status(400).send("New password must be at least 6 characters.");
        
        const valid = await comparePasswords(currentPassword, user.password);
        if (!valid) return res.status(400).send("Current password is incorrect.");
        
        hashedPassword = await hashPassword(newPassword);
        updatePw = true;
      }

      // 2. Validate Username if changing
      if (username && username !== user.username) {
        if (username.length < 3) return res.status(400).send("Username must be at least 3 characters long.");
        
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(400).send("Username is already taken.");
        }
        updateUn = true;
      }

      // 3. Execute Updates Securely
      if (updateUn) {
        await storage.updateUserUsername(req.user!.id, username);
      }
      if (updatePw) {
        await storage.updateUserPassword(req.user!.id, hashedPassword);
      }

      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  });
}
