import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Invalid Authorization header" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).admin = decoded;
    next();
  } catch (err: any) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}
