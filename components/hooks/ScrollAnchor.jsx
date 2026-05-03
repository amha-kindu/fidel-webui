import { useRef, useLayoutEffect, useCallback } from "react";


export function usePreserveScrollPosition({
    listRef,
    key,
    dep,
}) {
    const preserveRef = useRef(null);

    const snapshot = useCallback(() => {
        const el = listRef.current;
        if (!el) return;

        preserveRef.current = {
            key,
            prevScrollHeight: el.scrollHeight,
            prevScrollTop: el.scrollTop,
        };
    }, [key, listRef, preserveRef]);

    useLayoutEffect(() => {
        const el = listRef.current;
        const snap = preserveRef.current;

        if (!el || !snap) return;
        if (snap.key !== key) return;

        el.scrollTop = el.scrollHeight - snap.prevScrollHeight + snap.prevScrollTop;

        preserveRef.current = null;
    }, [key, dep, listRef, preserveRef]);

    return snapshot;
}
