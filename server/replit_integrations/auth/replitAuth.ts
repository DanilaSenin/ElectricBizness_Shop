import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { storage } from "../../storage";

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  }));

  // Login route
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await authStorage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Неверное имя пользователя или пароль" });
    }

    (req.session as any).userId = user.id;
    res.json(user);
  });

  // Register route
  app.post("/api/register", async (req, res) => {
    const { username, password, email, firstName, lastName } = req.body;
    
    const existing = await authStorage.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const user = await authStorage.createUser({
      username,
      password,
      email,
      firstName,
      lastName,
      id: Math.random().toString(36).substring(7)
    });

    (req.session as any).userId = user.id;
    res.json(user);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.status(204).end();
    });
  });
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/user", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const user = await authStorage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    
    res.json(user);
  });
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
