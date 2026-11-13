import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { mountOpenDesignLoading } from "./openDesignLoading";

export function OpenDesignLoadingMark({ height = 40 }: { height?: number }) {
  const host = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (host.current) return mountOpenDesignLoading(host.current);
  }, []);
  const style: CSSProperties = { display: "block", position: "relative", height, width: height * 1705 / 291, maxWidth: "100%" };
  return <span ref={host} style={style} aria-hidden="true" />;
}
