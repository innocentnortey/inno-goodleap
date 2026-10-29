import { defineConfig } from "vitest/config";

// Unit tests are server-side and pure (finance maths, guardrail checks, agent loop with FakeLlm). No network.
export default defineConfig({
  test: { include: ["apps/server/test/**/*.test.ts"], environment: "node" },
});
