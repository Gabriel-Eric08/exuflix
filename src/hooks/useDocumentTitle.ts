import { useEffect } from "react";

const BASE = "Exuflix";

/** `document.title = "Nome · Exuflix"`; null usa o título padrão. */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} · Toda história passa por aqui`;
  }, [title]);
}
