/** Ordinary operator signals cancel work before the owning composition drains. */
export async function signals<T>(work: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const interrupt = () => {
    process.exitCode = 130;
    controller.abort(Error("Operation interrupted by SIGINT"));
  };
  const terminate = () => {
    process.exitCode = 143;
    controller.abort(Error("Operation interrupted by SIGTERM"));
  };
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", terminate);
  try {
    return await work(controller.signal);
  } finally {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", terminate);
  }
}
