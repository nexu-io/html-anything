export {};

declare global {
  var openMotion:
    | Readonly<{
        daemon: string;
        token: string;
      }>
    | undefined;
}
