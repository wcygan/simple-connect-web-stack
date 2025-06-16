import { defineConfig } from "$fresh/server.ts";
import tailwind from "@fresh/plugin-tailwind";

export default defineConfig({
  plugins: [tailwind()],
});