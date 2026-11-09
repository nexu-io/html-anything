/** Blob retention time only; process ownership and transport deadlines use their own clocks. */
export const clock = { now: () => Date.now() };
