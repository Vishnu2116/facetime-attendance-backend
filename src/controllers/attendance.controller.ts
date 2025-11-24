import { Request, Response } from "express";
import pool from "../db/db";
import { searchFace } from "../services/rekognition.service";

export async function markAttendance(req: Request, res: Response) {
  try {
    const { imageBase64 } = req.body;

    const faceId = await searchFace(imageBase64);
    if (!faceId)
      return res.status(404).json({ message: "No matching face found" });

    const user = await pool.query(
      `SELECT * FROM users WHERE face_id = $1 LIMIT 1`,
      [faceId]
    );

    if (user.rowCount === 0)
      return res.status(404).json({ message: "User not found" });

    const userId = user.rows[0].id;

    // Check last event for multi IN/OUT logic
    const last = await pool.query(
      `SELECT event_type FROM attendance_events
       WHERE user_id=$1 ORDER BY event_time DESC LIMIT 1`,
      [userId]
    );

    let newType = "ENTRY";
    if (last.rowCount > 0 && last.rows[0].event_type === "ENTRY") {
      newType = "EXIT";
    }

    const now = new Date();
    const attDate = now.toISOString().slice(0, 10);

    const insert = await pool.query(
      `INSERT INTO attendance_events (user_id, event_type, event_time, att_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, newType, now, attDate]
    );

    res.json({
      status: "success",
      user: user.rows[0],
      event: insert.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
