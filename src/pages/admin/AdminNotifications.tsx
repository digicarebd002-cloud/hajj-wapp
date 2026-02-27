import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send } from "lucide-react";

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Send Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" /></div>
          <div><Label>Body</Label><Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Notification message" /></div>
          <div>
            <Label>Target Audience</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="Silver">Silver Tier</SelectItem>
                <SelectItem value="Gold">Gold Tier</SelectItem>
                <SelectItem value="Platinum">Platinum Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={send} disabled={sending}>
            <Send className="mr-2 h-4 w-4" />{sending ? "Sending..." : "Send Notification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
