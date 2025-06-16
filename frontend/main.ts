import { App, fsRoutes, staticFiles } from "fresh";

export const app = new App();
app.use(staticFiles());

// Simple middleware for logging
app.use((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});

await fsRoutes(app, {
  dir: "./",
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  const port = parseInt(Deno.env.get("PORT") || "8007");
  await app.listen({ port, hostname: "0.0.0.0" });
}
