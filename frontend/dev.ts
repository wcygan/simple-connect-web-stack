#!/usr/bin/env -S deno run -A --watch=static/,routes/

import { Builder } from "fresh/dev";
import { app } from "./main.ts";

const builder = new Builder();

if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  const port = parseInt(Deno.env.get("PORT") || "8007");
  await builder.listen(app, {
    port: port,
    hostname: "0.0.0.0",
  });
}
