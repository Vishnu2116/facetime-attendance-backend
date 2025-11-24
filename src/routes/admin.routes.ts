import express from "express";
import {
  adminLogin,
  adminGetUsers,
  adminGetUserAttendance,
} from "../controllers/admin.controller";
import { verifyAdmin } from "../middleware/auth";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/users", verifyAdmin, adminGetUsers);
router.get("/users/:id/attendance", verifyAdmin, adminGetUserAttendance);

export default router;
