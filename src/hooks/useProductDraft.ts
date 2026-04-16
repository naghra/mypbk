import { useCallback, useEffect, useRef, useState } from "react";

export interface ProductDraftData {
  nameAr: string;
  descAr: string;
  price: string;
  compareAt: string;
  inventory: string;
  sku: string;
  category: string;
  isActive: boolean;
  tags: string[];
  currencyEnabled: boolean;
  currencyCode: string;
  hiddenFromHome: boolean;
  slug: string;
  snapchatConversionValue: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

const DRAFT_KEY_PREFIX = "product_draft_";
const DEBOUNCE_MS = 2000;

function getDraftKey(id: string | undefined) {
  return `${DRAFT_KEY_PREFIX}${id || "new"}`;
}

export function useProductDraft(productId: string | undefined) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [hasDraft, setHasDraft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialDataRef = useRef<string | null>(null);
  const isDataLoadedRef = useRef(false);

  const key = getDraftKey(productId);

  // Check if draft exists on mount
  useEffect(() => {
    const stored = localStorage.getItem(key);
    setHasDraft(!!stored);
  }, [key]);

  const getDraft = useCallback((): ProductDraftData | null => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
    setHasDraft(false);
    setSaveStatus("idle");
    initialDataRef.current = null;
  }, [key]);

  const setInitialData = useCallback((data: ProductDraftData) => {
    initialDataRef.current = JSON.stringify(data);
    isDataLoadedRef.current = true;
    setSaveStatus("idle");
  }, []);

  const saveDraft = useCallback((data: ProductDraftData) => {
    // Don't save if data hasn't been loaded yet (prevents saving empty state)
    if (!isDataLoadedRef.current) return;
    
    const serialized = JSON.stringify(data);
    
    // No changes from initial data
    if (initialDataRef.current && serialized === initialDataRef.current) {
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    try {
      localStorage.setItem(key, serialized);
      setHasDraft(true);
    } catch { /* storage full */ }
    
    setTimeout(() => setSaveStatus("saved"), 300);
  }, [key]);

  const debouncedSave = useCallback((data: ProductDraftData) => {
    if (!isDataLoadedRef.current) return;
    
    const serialized = JSON.stringify(data);
    if (initialDataRef.current && serialized === initialDataRef.current) {
      setSaveStatus("idle");
      return;
    }
    
    setSaveStatus("unsaved");
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveDraft(data), DEBOUNCE_MS);
  }, [saveDraft]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Browser beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved" || saveStatus === "saved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveStatus]);

  return {
    saveStatus,
    hasDraft,
    getDraft,
    clearDraft,
    debouncedSave,
    setInitialData,
    saveDraft,
  };
}
