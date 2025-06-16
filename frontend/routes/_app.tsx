import type { PageProps } from "fresh";

export default function App({ Component }: PageProps) {
  return (
    <html class="scroll-smooth">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Todo App v2 | ConnectRPC + Deno Fresh</title>
        <meta name="description" content="Modern todo application built with Go ConnectRPC backend and Deno Fresh frontend" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body class="font-sans">
        <Component />
      </body>
    </html>
  );
}
