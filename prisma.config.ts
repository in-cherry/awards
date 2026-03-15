import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/lib/database/prisma/schema.prisma",
  migrations: {
    path: "src/lib/database/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
