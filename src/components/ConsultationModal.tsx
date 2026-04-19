import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Phone, Mail, User as UserIcon, MessageSquare } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  preferredDate: z.date({ required_error: "Please pick a preferred date" }),
  notes: z.string().trim().max(500).optional(),
});

interface ConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConsultationModal = ({ open, onOpenChange }: ConsultationModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, phone, preferredDate, notes });
    if (!parsed.success) {
      toast({ title: "Please check the form", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const message = `Free Consultation Request\n\nPhone: ${parsed.data.phone}\nPreferred Date: ${format(parsed.data.preferredDate, "PPP")}\n\nNotes: ${parsed.data.notes || "—"}`;
    const { error } = await supabase.from("contact_messages").insert({
      user_id: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      subject: "Free Consultation Request",
      message,
      status: "new",
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request received!", description: "Our advisor will contact you shortly." });
    setName(""); setPhone(""); setPreferredDate(undefined); setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Schedule Free Consultation
          </DialogTitle>
          <DialogDescription>
            Share your details and a Hajj advisor will reach out within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cm-name" className="flex items-center gap-1.5 text-xs"><UserIcon className="h-3.5 w-3.5" /> Full Name</Label>
            <Input id="cm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" maxLength={100} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cm-email" className="flex items-center gap-1.5 text-xs"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input id="cm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm-phone" className="flex items-center gap-1.5 text-xs"><Phone className="h-3.5 w-3.5" /> Phone</Label>
              <Input id="cm-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" maxLength={30} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs"><CalendarIcon className="h-3.5 w-3.5" /> Preferred Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal", !preferredDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {preferredDate ? format(preferredDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={preferredDate}
                  onSelect={setPreferredDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cm-notes" className="flex items-center gap-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" /> Notes (optional)</Label>
            <Textarea id="cm-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific questions or preferences..." rows={3} maxLength={500} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationModal;
