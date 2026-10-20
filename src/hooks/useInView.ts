import { useEffect, useRef, useState } from "react";

/** Vira true (uma vez) quando o elemento chega perto do viewport. */
export function useInView<T extends Element>(rootMargin = "400px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") return setInView(true);
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView] as const;
}
