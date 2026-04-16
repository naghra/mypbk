import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type CheckAdminOptions = {
  blockUi?: boolean;
  preserveStateOnError?: boolean;
};

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasResolvedInitialStateRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const applySignedOutState = () => {
      currentUserIdRef.current = null;

      if (!mounted) return;

      setIsAdmin(false);
      setIsAuthenticated(false);
      setUserId(null);
      setLoading(false);
      hasResolvedInitialStateRef.current = true;
    };

    const checkAdmin = async (
      uid: string | null,
      options: CheckAdminOptions = {},
    ) => {
      const {
        blockUi = !hasResolvedInitialStateRef.current,
        preserveStateOnError = hasResolvedInitialStateRef.current,
      } = options;

      if (!uid) {
        applySignedOutState();
        return;
      }

      if (mounted) {
        setIsAuthenticated(true);
        setUserId(uid);
        if (blockUi) setLoading(true);
      }

      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && mounted) {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();

        if (!error) {
          currentUserIdRef.current = uid;

          if (mounted) {
            setIsAdmin(!!data);
            setIsAuthenticated(true);
            setUserId(uid);
            setLoading(false);
            hasResolvedInitialStateRef.current = true;
          }
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
          await supabase.auth.getSession();
        }
      }

      if (!mounted) return;

      if (!preserveStateOnError) {
        setIsAdmin(false);
      }
      setLoading(false);
      hasResolvedInitialStateRef.current = true;
    };

    const handleAuthStateChange = (event: string, nextUserId: string | null) => {
      if (event === "SIGNED_OUT") {
        applySignedOutState();
        return;
      }

      const isSameUser = currentUserIdRef.current === nextUserId;
      const isBackgroundRefreshEvent =
        event === "TOKEN_REFRESHED" || event === "USER_UPDATED";

      void checkAdmin(nextUserId, {
        blockUi:
          !hasResolvedInitialStateRef.current ||
          (!isSameUser && !isBackgroundRefreshEvent),
        preserveStateOnError:
          (isSameUser && hasResolvedInitialStateRef.current) ||
          isBackgroundRefreshEvent,
      });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange("INITIAL_SESSION", session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading, userId, isAuthenticated };
}

