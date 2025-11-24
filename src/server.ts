import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.routes";
import attendanceRoutes from "./routes/attendance.routes";
import adminRoutes from "./routes/admin.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
console.log("🟦 Loaded DATABASE_URL =", process.env.DATABASE_URL);

app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Face Attendance Backend Running");
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
