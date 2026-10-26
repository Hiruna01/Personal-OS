import "server-only";

/** Opt-in server timings without private content, identifiers, or credentials. */
export async function measureServer<T>(
  name: string,
  run: () => PromiseLike<T>,
): Promise<T> {
  if (process.env.PERFORMANCE_LOGGING !== "true") return await run();
  const started = performance.now();
  try {
    return await run();
  } finally {
    console.info(
      `[performance] ${name}: ${Math.round(performance.now() - started)}ms`,
    );
  }
}
