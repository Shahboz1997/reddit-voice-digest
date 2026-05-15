import "./lib/load-env";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Introspection / migrate: DIRECT_URL (session pooler :5432 или db.*). Если db.* недоступен (сеть/регион), задайте DIRECT_URL на pooler :5432.
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/postgres",
  },
});
