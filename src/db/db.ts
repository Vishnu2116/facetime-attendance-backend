import pkg from "pg";
const { Pool } = pkg;

const isRds = process.env.DATABASE_URL?.includes("rds.amazonaws.com");

const pool = new Pool({
  connectionString:
    "postgres://postgres:Polygon_devops@poc-testing.cgk8lxh8og3g.ap-south-2.rds.amazonaws.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
