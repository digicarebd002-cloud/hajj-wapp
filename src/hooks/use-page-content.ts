import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageContent {
  [sectionKey: string]: string;
}

export function usePageContent(pageSlug: string) {
  const [content, setContent] = useState<PageContent>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!pageSlug) return;
    setLoading(true);
    const { data } = await supabase
      .from("page_contents")
      .select("section_key, content_value")
      .eq("page_slug", pageSlug)
      .order("sort_order", { ascending: true }) as any;

    const map: PageContent = {};
    (data as { section_key: string; content_value: string }[] || []).forEach(
      (r) => (map[r.section_key] = r.content_value)
    );
    setContent(map);
    setLoading(false);
  }, [pageSlug]);

  useEffect(() => { refetch(); }, [refetch]);

  const get = (key: string, fallback: string = "") => content[key] ?? fallback;

  return { content, get, loading, refetch };
}
