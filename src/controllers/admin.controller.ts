import { Request, Response } from "express";
import pool from "../db/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ---------------------
// ADMIN LOGIN
// ---------------------
export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const admin = await pool.query(
      `SELECT * FROM admins WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (admin.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const valid = await bcrypt.compare(password, admin.rows[0].password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: admin.rows[0].id, email: admin.rows[0].email },
      process.env.JWT_SECRET!,
      { expiresIn: "2d" }
    );

    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// ---------------------
// ADMIN: GET ALL USERS
// ---------------------
export async function adminGetUsers(req: Request, res: Response) {
  try {
    const users = await pool.query(
      `SELECT id, name, phone, enrollment_number, created_at
       FROM users ORDER BY created_at DESC`
    );

    res.json(users.rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// ---------------------
// ADMIN: USER ATTENDANCE HISTORY
// ---------------------
export async function adminGetUserAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    let query = `
      SELECT id, event_type, event_time, att_date
      FROM attendance_events
      WHERE user_id = $1
    `;

    const params: any[] = [id];

    if (from) {
      params.push(from);
      query += ` AND att_date >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      query += ` AND att_date <= $${params.length}`;
    }

    query += ` ORDER BY event_time DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
