import "./lib/load-env";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Introspection / migrate: только прямое подключение (DIRECT_URL), не transaction pooler.
    url:
      process.env.DIRECT_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/postgres",
  },
});
