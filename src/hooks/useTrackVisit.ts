import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function getVisitorId(): string {
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

export function useTrackVisit(pagePath: string = "/") {
  useEffect(() => {
    const visitorId = getVisitorId();

    // Record initial visit
    supabase.from("page_visits").insert({
      visitor_id: visitorId,
      page_path: pagePath,
    }).then(() => {});

    // Heartbeat every 30s to keep "active" status
    const iv = setInterval(() => {
      supabase.from("page_visits").insert({
        visitor_id: visitorId,
        page_path: pagePath,
      }).then(() => {});
    }, 30000);

    return () => clearInterval(iv);
  }, [pagePath]);
}
