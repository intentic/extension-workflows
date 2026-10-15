import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        environment: "node",
        setupFiles: ["test/host-stub.mjs"],
        testTimeout: 20_000,
    },
});
