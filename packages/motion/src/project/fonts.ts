/** Runs only in the derived native document; font loading is distinct from the timeline protocol. */
export function fontBridge() {
  const surface = window as typeof window & { __openMotionFonts?: Promise<void>; __hfStartupError?: string };
  const loaded = async () => {
    const families = JSON.parse(document.documentElement.getAttribute("data-open-motion-fonts") ?? "[]") as string[];
    if (families.length > 64 || families.some((family) => !/^OpenMotionFont_[a-f0-9]{64}$/.test(family)))
      throw Error("invalid project font identities");
    await Promise.all(
      families.map(async (family) => {
        const faces = await document.fonts.load(`16px "${family}"`);
        if (!faces.length || faces.some((face) => face.status !== "loaded")) throw Error("project font unavailable");
      }),
    );
  };
  surface.__openMotionFonts = loaded();
  void surface.__openMotionFonts.then(
    () => parent.postMessage({ source: "open-motion-fonts", protocolVersion: 1, ready: true }, "*"),
    () => {
      surface.__hfStartupError = "Project font loading failed";
      parent.postMessage({ source: "open-motion-fonts", protocolVersion: 1, ready: false }, "*");
    },
  );
}
