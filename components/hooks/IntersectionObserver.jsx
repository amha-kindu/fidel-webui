import { useCallback, useEffect, useRef } from "react";

export function useIntersectionObserver({
  root = null,
  onIntersect,
  enabled = true,
  threshold = 0,
  rootMargin = "0px",
}) {
  const observerRef = useRef(null);
  const nodeRef = useRef(null);
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  const observe = useCallback((node) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    if (!enabled || !nodeRef.current) return undefined;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersectRef.current?.();
        }
      },
      { root, rootMargin, threshold }
    );

    observerRef.current.observe(nodeRef.current);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [enabled, root, rootMargin, threshold]);

  return observe;
}
