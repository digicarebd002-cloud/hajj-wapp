import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Eye, Clock, CheckCircle2, Archive, Search, MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  unread: { label: "অপঠিত", color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", icon: Mail },
  read: { label: "পঠিত", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30", icon: Eye },
  replied: { label: "উত্তর দেওয়া হয়েছে", color: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30", icon: CheckCircle2 },
  archived: { label: "আর্কাইভ", color: "bg-muted text-muted-foreground border-border", icon: Archive },
};

export default function AdminContacts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContactMessage[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const updateData: any = { status };
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
      const { error } = await supabase
        .from("contact_messages" as any)
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast({ title: "আপডেট সফল!" });
    },
  });

  const openMessage = (msg: ContactMessage) => {
    setSelectedMsg(msg);
    setAdminNotes(msg.admin_notes || "");
    if (msg.status === "unread") {
      updateMutation.mutate({ id: msg.id, status: "read" });
    }
  };

  const handleStatusChange = (status: string) => {
    if (!selectedMsg) return;
    updateMutation.mutate({ id: selectedMsg.id, status, admin_notes: adminNotes });
    setSelectedMsg({ ...selectedMsg, status, admin_notes: adminNotes });
  };

  const handleSaveNotes = () => {
    if (!selectedMsg) return;
    updateMutation.mutate({ id: selectedMsg.id, status: selectedMsg.status, admin_notes: adminNotes });
    toast({ title: "নোট সেভ হয়েছে" });
  };

  const filtered = messages.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Contact Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            মোট {messages.length}টি মেসেজ {unreadCount > 0 && `• ${unreadCount}টি অপঠিত`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = messages.filter((m) => m.status === key).length;
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(key === filterStatus ? "all" : key)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.color}`}>
                  <cfg.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নাম, ইমেইল বা বিষয় দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>কোনো মেসেজ পাওয়া যায়নি</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>প্রেরক</TableHead>
                  <TableHead>বিষয়</TableHead>
                  <TableHead className="hidden md:table-cell">তারিখ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((msg) => {
                  const cfg = statusConfig[msg.status] || statusConfig.unread;
                  return (
                    <TableRow
                      key={msg.id}
                      className={`cursor-pointer ${msg.status === "unread" ? "font-semibold bg-primary/5" : ""}`}
                      onClick={() => openMessage(msg)}
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm">{msg.name}</p>
                          <p className="text-xs text-muted-foreground">{msg.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[200px]">{msg.subject}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "dd MMM yyyy, hh:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openMessage(msg); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={(open) => !open && setSelectedMsg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              মেসেজ বিস্তারিত
            </DialogTitle>
          </DialogHeader>
          {selectedMsg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">নাম</p>
                  <p className="font-semibold">{selectedMsg.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">ইমেইল</p>
                  <a href={`mailto:${selectedMsg.email}`} className="font-semibold text-primary hover:underline">
                    {selectedMsg.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">বিষয়</p>
                  <p className="font-semibold">{selectedMsg.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">তারিখ</p>
                  <p>{format(new Date(selectedMsg.created_at), "dd MMM yyyy, hh:mm a")}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">মেসেজ</p>
                <div className="bg-secondary/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedMsg.message}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">স্ট্যাটাস পরিবর্তন</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <Button
                      key={key}
                      variant={selectedMsg.status === key ? "default" : "outline"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleStatusChange(key)}
                    >
                      <cfg.icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">অ্যাডমিন নোট</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="এই মেসেজ সম্পর্কে নোট লিখুন..."
                  rows={3}
                />
                <Button size="sm" className="mt-2 gap-1.5" onClick={handleSaveNotes}>
                  <Send className="h-3.5 w-3.5" />
                  নোট সেভ করুন
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
