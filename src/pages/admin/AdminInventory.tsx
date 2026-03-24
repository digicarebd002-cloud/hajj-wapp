import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertTriangle, Search, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("products").select("*").order("name");
      setProducts(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = products.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (stockFilter === "low" && (p.stock === -1 || p.stock > 5)) return false;
    if (stockFilter === "out" && p.stock !== 0) return false;
    if (stockFilter === "in" && (p.stock === 0 || p.stock === -1)) return false;
    return true;
  });

  const updateStock = async (id: string, stock: number) => {
    const { error } = await supabase.from("products").update({ stock }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock } : p));
      toast.success("Stock updated");
    }
  };

  const lowStock = products.filter(p => p.stock !== -1 && p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const inStock = products.filter(p => p.stock === -1 || p.stock > 0).length;

  const exportCSV = () => {
    const headers = ["Name", "Price", "Stock", "Category", "Status"];
    const rows = products.map(p => [p.name, p.price, p.stock === -1 ? "Unlimited" : p.stock, p.category || "", p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? "Low Stock" : "In Stock"]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `inventory_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const stockBadge = (stock: number) => {
    if (stock === -1) return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Unlimited</Badge>;
    if (stock === 0) return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Out of Stock</Badge>;
    if (stock <= 5) return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">Low ({stock})</Badge>;
    return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{stock} units</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Package className="h-5 w-5 text-amber-400" />
            </div>
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">Stock levels & alerts</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "In Stock", value: inStock, icon: Package, color: "text-emerald-400" },
          { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "text-amber-400" },
          { label: "Out of Stock", value: outOfStock, icon: AlertTriangle, color: "text-red-400" },
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

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-bold text-foreground/80">Product</TableHead>
              <TableHead className="font-bold text-foreground/80">Price</TableHead>
              <TableHead className="font-bold text-foreground/80">Stock Status</TableHead>
              <TableHead className="font-bold text-foreground/80">Update Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12 font-medium">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12 font-medium">No products found</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-bold text-foreground">{p.name}</TableCell>
                <TableCell className="font-bold text-primary">${p.price}</TableCell>
                <TableCell>{stockBadge(p.stock)}</TableCell>
                <TableCell>
                  <Input
                    type="number" className="w-24 bg-secondary/30 border-border/50" defaultValue={p.stock === -1 ? "" : p.stock}
                    placeholder={p.stock === -1 ? "∞" : "0"}
                    onBlur={e => { const v = e.target.value; if (v !== "") updateStock(p.id, parseInt(v)); }}
                    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
