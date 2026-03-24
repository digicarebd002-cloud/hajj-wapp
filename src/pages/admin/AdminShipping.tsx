import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Truck, MapPin, Plus, Edit2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ShippingZone {
  id: string; name: string; regions: string; rate: number; freeAbove: number; enabled: boolean; estimatedDays: string;
}

export default function AdminShipping() {
  const [zones, setZones] = useState<ShippingZone[]>([
    { id: "1", name: "Domestic", regions: "Bangladesh", rate: 5.00, freeAbove: 50, enabled: true, estimatedDays: "3-5" },
    { id: "2", name: "South Asia", regions: "India, Pakistan, Sri Lanka", rate: 15.00, freeAbove: 100, enabled: true, estimatedDays: "7-10" },
    { id: "3", name: "Middle East", regions: "Saudi Arabia, UAE, Qatar", rate: 25.00, freeAbove: 200, enabled: true, estimatedDays: "5-7" },
    { id: "4", name: "International", regions: "Rest of World", rate: 40.00, freeAbove: 300, enabled: false, estimatedDays: "10-15" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState({ name: "", regions: "", rate: "", freeAbove: "", estimatedDays: "" });

  const openEdit = (z: ShippingZone) => {
    setEditing(z);
    setForm({ name: z.name, regions: z.regions, rate: String(z.rate), freeAbove: String(z.freeAbove), estimatedDays: z.estimatedDays });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", regions: "", rate: "", freeAbove: "", estimatedDays: "" });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name || !form.rate) return toast.error("Fill required fields");
    if (editing) {
      setZones(prev => prev.map(z => z.id === editing.id ? { ...z, ...form, rate: parseFloat(form.rate), freeAbove: parseFloat(form.freeAbove || "0") } : z));
      toast.success("Zone updated");
    } else {
      setZones(prev => [...prev, { id: String(Date.now()), ...form, rate: parseFloat(form.rate), freeAbove: parseFloat(form.freeAbove || "0"), enabled: true }]);
      toast.success("Zone added");
    }
    setDialogOpen(false);
  };

  const toggleZone = (id: string) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, enabled: !z.enabled } : z));
  };

  const deleteZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
    toast.success("Zone deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-400" />
            </div>
            Shipping & Logistics
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">Manage shipping zones & rates</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Zone</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Zones", value: zones.filter(z => z.enabled).length, icon: MapPin, color: "text-emerald-400" },
          { label: "Total Zones", value: zones.length, icon: Truck, color: "text-blue-400" },
          { label: "Avg Rate", value: `$${(zones.reduce((s, z) => s + z.rate, 0) / (zones.length || 1)).toFixed(2)}`, icon: Truck, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-5 flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-bold text-foreground/80">Zone</TableHead>
              <TableHead className="font-bold text-foreground/80">Regions</TableHead>
              <TableHead className="font-bold text-foreground/80">Rate</TableHead>
              <TableHead className="font-bold text-foreground/80">Free Above</TableHead>
              <TableHead className="font-bold text-foreground/80">Est. Days</TableHead>
              <TableHead className="font-bold text-foreground/80">Status</TableHead>
              <TableHead className="font-bold text-foreground/80">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map(z => (
              <TableRow key={z.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-bold text-foreground">{z.name}</TableCell>
                <TableCell className="text-foreground/80 font-medium">{z.regions}</TableCell>
                <TableCell className="font-bold text-primary">${z.rate.toFixed(2)}</TableCell>
                <TableCell className="text-foreground/70 font-medium">${z.freeAbove.toFixed(2)}</TableCell>
                <TableCell className="text-foreground/70 font-medium">{z.estimatedDays} days</TableCell>
                <TableCell><Switch checked={z.enabled} onCheckedChange={() => toggleZone(z.id)} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(z)}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteZone(z.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-bold">{editing ? "Edit Zone" : "Add Shipping Zone"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Zone Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Regions (comma separated)" value={form.regions} onChange={e => setForm(p => ({ ...p, regions: e.target.value }))} />
            <Input type="number" placeholder="Shipping Rate ($)" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} />
            <Input type="number" placeholder="Free Shipping Above ($)" value={form.freeAbove} onChange={e => setForm(p => ({ ...p, freeAbove: e.target.value }))} />
            <Input placeholder="Estimated Days (e.g. 3-5)" value={form.estimatedDays} onChange={e => setForm(p => ({ ...p, estimatedDays: e.target.value }))} />
            <Button className="w-full" onClick={save}>{editing ? "Update" : "Add"} Zone</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
