/** Render provides PORT; local development stays on loopback behind Vite. */
export function serverOptions(env: NodeJS.ProcessEnv) {
  return {
    port: Number(env.PORT || env.API_PORT || 8787),
    hostname: env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
  };
}
