import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_user: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    tier: string;
  } | null;
  last_message?: {
    body: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

// Get or create a conversation with another user
export function useGetOrCreateConversation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getOrCreate = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      // Check if conversation already exists between these two users
      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvos && myConvos.length > 0) {
        const convIds = myConvos.map((c: any) => c.conversation_id);
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", convIds);

        if (shared && shared.length > 0) {
          setLoading(false);
          return shared[0].conversation_id;
        }
      }

      // Create new conversation
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({})
        .select("id")
        .single();

      if (convErr || !newConv) {
        console.error("Failed to create conversation:", convErr);
        setLoading(false);
        return null;
      }

      // Add both participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);

      setLoading(false);
      return newConv.id;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return null;
    }
  }, [user]);

  return { getOrCreate, loading };
}

// List all conversations for the current user
export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Get user's conversation IDs
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (!participations || participations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participations.map((p: any) => p.conversation_id);
    const readMap = new Map(participations.map((p: any) => [p.conversation_id, p.last_read_at]));

    // Get conversations
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    if (!convos) { setConversations([]); setLoading(false); return; }

    // Get other participants
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .neq("user_id", user.id);

    const otherUserIds = [...new Set((allParticipants ?? []).map((p: any) => p.user_id))];
    const participantMap = new Map((allParticipants ?? []).map((p: any) => [p.conversation_id, p.user_id]));

    // Get profiles
    let profileMap = new Map<string, any>();
    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, tier")
        .in("user_id", otherUserIds);
      profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    }

    // Get last message per conversation
    const results: Conversation[] = [];
    for (const conv of convos) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Count unread
      const lastRead = readMap.get(conv.id);
      let unreadCount = 0;
      if (lastRead) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .gt("created_at", lastRead);
        unreadCount = count ?? 0;
      }

      const otherUserId = participantMap.get(conv.id);
      results.push({
        id: conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        other_user: otherUserId ? profileMap.get(otherUserId) || null : null,
        last_message: lastMsg && lastMsg.length > 0 ? lastMsg[0] : null,
        unread_count: unreadCount,
      });
    }

    setConversations(results);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-update")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}

// Messages for a specific conversation with realtime
export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);

    // Mark as read
    if (user) {
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
    }
  }, [conversationId, user]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        // Mark as read
        if (user) {
          supabase
            .from("conversation_participants")
            .update({ last_read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .eq("user_id", user.id)
            .then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  const sendMessage = useCallback(async (body: string) => {
    if (!conversationId || !user || !body.trim()) return;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: body.trim(),
    });
  }, [conversationId, user]);

  return { messages, loading, sendMessage, refetch: fetchMessages };
}

// Search users to start a new conversation
export function useSearchUsers(query: string) {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2 || !user) { setResults([]); return; }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, tier")
        .neq("user_id", user.id)
        .ilike("full_name", `%${query}%`)
        .limit(10);
      setResults(data ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, user]);

  return { results, loading };
}
