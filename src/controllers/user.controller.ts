// src/controllers/user.controller.ts
import { Request, Response } from "express";
import pool from "../db/db";
import { registerFace, searchFace } from "../services/rekognition.service";

export async function registerUser(req: Request, res: Response) {
  try {
    const { name, phone, imageBase64 } = req.body;

    if (!name || !phone || !imageBase64) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // 1️⃣ **CHECK IF FACE ALREADY EXISTS IN AWS COLLECTION**
    const existingFaceId = await searchFace(imageBase64);

    if (existingFaceId) {
      // Check if that face belongs to someone in our DB
      const exists = await pool.query(
        `SELECT name, phone, enrollment_number 
         FROM users 
         WHERE face_id = $1 
         LIMIT 1`,
        [existingFaceId]
      );

      if (exists.rowCount > 0) {
        return res.status(409).json({
          message: "This face is already registered with another employee.",
          existingUser: exists.rows[0],
        });
      }
    }

    // 2️⃣ **REGISTER NEW FACE (since no duplicate detected)**
    const faceId = await registerFace(imageBase64);

    // 3️⃣ **GENERATE ENROLLMENT NUMBER**
    const enrollmentNumber = "ENR" + Date.now().toString().slice(-6);

    // 4️⃣ **INSERT NEW USER INTO DATABASE**
    const result = await pool.query(
      `INSERT INTO users (name, phone, enrollment_number, face_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, phone, enrollment_number, face_id`,
      [name, phone, enrollmentNumber, faceId]
    );

    // 5️⃣ **SEND SUCCESS RESPONSE**
    return res.json(result.rows[0]);
  } catch (err: any) {
    console.error("❌ REGISTER USER ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
}
