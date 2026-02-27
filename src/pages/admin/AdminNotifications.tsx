import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Bell, Megaphone } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tier, setTier] = useState("all");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSending(true);

    let query = supabase.from("profiles").select("user_id");
    if (tier !== "all") query = query.eq("tier", tier);
    const { data: users } = await query;

    if (!users || users.length === 0) {
      toast.error("No users found");
      setSending(false);
      return;
    }

    const notifications = users.map(u => ({
      user_id: u.user_id,
      title,
      body: body || "",
      type: "broadcast",
    }));

    const { error } = await supabase.from("notifications").insert(notifications as any);
    if (error) toast.error(error.message);
    else {
      toast.success(`Sent to ${users.length} users`);
      setTitle("");
      setBody("");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1 ml-[52px]">Send broadcast notifications</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden"
      >
        <div className="p-5 border-b border-border/30 bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-foreground">Compose Broadcast</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" className="bg-secondary/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your notification message..." rows={4} className="bg-secondary/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Audience</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="Silver">Silver Tier</SelectItem>
                <SelectItem value="Gold">Gold Tier</SelectItem>
                <SelectItem value="Platinum">Platinum Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full font-semibold gap-2 shadow-lg shadow-primary/20" onClick={send} disabled={sending}>
            <Send className="h-4 w-4" />{sending ? "Sending..." : "Send Notification"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}