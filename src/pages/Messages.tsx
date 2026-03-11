import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, useSearchUsers, useGetOrCreateConversation, Conversation } from "@/hooks/use-messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, MessageSquarePlus, ArrowLeft, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const formatMsgTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
};

const Messages = () => {
  const { user } = useAuth();
  const { conversations, loading: convoLoading } = useConversations();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { results: searchResults, loading: searchLoading } = useSearchUsers(searchQuery);
  const { getOrCreate, loading: creatingConvo } = useGetOrCreateConversation();
  const { messages, loading: msgsLoading, sendMessage } = useMessages(activeConvo);
  const [msgInput, setMsgInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <MessageSquarePlus className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-bold text-foreground">Private Messaging</h2>
        <p className="text-muted-foreground text-center">Sign in to send messages</p>
        <Link to="/auth">
          <Button className="rounded-full">Sign In</Button>
        </Link>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeConvo);

  const handleStartConversation = async (otherUserId: string) => {
    const convId = await getOrCreate(otherUserId);
    if (convId) {
      setActiveConvo(convId);
      setShowNewChat(false);
      setSearchQuery("");
      setMobileShowChat(true);
    }
  };

  const handleSend = async () => {
    if (!msgInput.trim()) return;
    await sendMessage(msgInput);
    setMsgInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sidebar: conversation list
  const ConversationList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-lg text-foreground">Messages</h2>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setShowNewChat(!showNewChat)}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>

      {showNewChat && (
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-secondary/50"
              autoFocus
            />
          </div>
          {searchLoading && <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => handleStartConversation(u.user_id)}
                  disabled={creatingConvo}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/80 transition-colors text-left"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || ""} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{u.full_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.tier}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No users found</p>
          )}
        </div>
      )}

      <ScrollArea className="flex-1">
        {convoLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <MessageSquarePlus className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click the + button to start a new chat</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => { setActiveConvo(conv.id); setMobileShowChat(true); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  activeConvo === conv.id ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/60"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.other_user?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {conv.other_user?.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {conv.other_user?.full_name || "Unknown"}
                    </span>
                    {conv.last_message && (
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                        {formatMsgTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {conv.last_message.sender_id === user?.id ? "You: " : ""}{conv.last_message.body}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Chat area
  const ChatArea = () => {
    if (!activeConvo) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquarePlus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Start Messaging</h3>
          <p className="text-sm text-muted-foreground mt-1">Select a conversation or start a new chat</p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Chat header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full shrink-0"
            onClick={() => setMobileShowChat(false)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={activeConversation?.other_user?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {activeConversation?.other_user?.full_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-foreground">{activeConversation?.other_user?.full_name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{activeConversation?.other_user?.tier || ""}</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {msgsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">কোনো মেসেজ নেই — প্রথম মেসেজ পাঠান!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const showDate = idx === 0 || format(new Date(messages[idx - 1].created_at), "yyyy-MM-dd") !== format(new Date(msg.created_at), "yyyy-MM-dd");
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-[10px] bg-secondary text-muted-foreground px-3 py-1 rounded-full">
                          {isToday(new Date(msg.created_at)) ? "আজ" : isYesterday(new Date(msg.created_at)) ? "গতকাল" : format(new Date(msg.created_at), "d MMM yyyy")}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="মেসেজ লিখুন..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-full bg-secondary/50"
            />
            <Button
              size="icon"
              className="rounded-full shrink-0"
              onClick={handleSend}
              disabled={!msgInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden" style={{ height: "calc(100vh - 12rem)" }}>
        <div className="flex h-full">
          {/* Sidebar - hidden on mobile when chat is open */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-border h-full ${mobileShowChat ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
            <ConversationList />
          </div>
          {/* Chat area - hidden on mobile when no chat selected */}
          <div className={`flex-1 h-full ${!mobileShowChat ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
            <ChatArea />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
