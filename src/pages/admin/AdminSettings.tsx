import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Palette, Globe, Share2, Code, Save, Upload, Image } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface SettingField {
  key: string;
  label: string;
  type: "text" | "textarea" | "color-hsl" | "url" | "email";
  placeholder: string;
  hint?: string;
}

const brandingFields: SettingField[] = [
  { key: "site_name", label: "Site Name", type: "text", placeholder: "Hajj Wallet" },
  { key: "site_tagline", label: "Tagline", type: "text", placeholder: "Your Sacred Journey Starts Here" },
  { key: "site_description", label: "Site Description", type: "textarea", placeholder: "A brief description of your website", hint: "Used in SEO meta tags (max 160 chars)" },
  { key: "logo_url", label: "Logo URL", type: "url", placeholder: "https://example.com/logo.png" },
  { key: "favicon_url", label: "Favicon URL", type: "url", placeholder: "https://example.com/favicon.ico" },
  { key: "footer_text", label: "Footer Text", type: "text", placeholder: "© 2025 Hajj Wallet" },
];

const colorFields: SettingField[] = [
  { key: "primary_color", label: "Primary Color (HSL)", type: "color-hsl", placeholder: "168 76% 50%", hint: "Format: H S% L% — e.g. 168 76% 50%" },
  { key: "background_color", label: "Background Color (HSL)", type: "color-hsl", placeholder: "170 40% 16%", hint: "Format: H S% L% — e.g. 186 41% 12%" },
  { key: "accent_color", label: "Accent Color (HSL)", type: "color-hsl", placeholder: "168 76% 50%", hint: "Used for highlights and accents" },
];

const seoFields: SettingField[] = [
  { key: "og_image_url", label: "OG Image URL", type: "url", placeholder: "https://example.com/og-image.jpg", hint: "Social share image (1200×630 recommended)" },
  { key: "contact_email", label: "Contact Email", type: "email", placeholder: "contact@example.com" },
];

const socialFields: SettingField[] = [
  { key: "social_facebook", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/yourpage" },
  { key: "social_twitter", label: "Twitter / X URL", type: "url", placeholder: "https://x.com/yourhandle" },
  { key: "social_instagram", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/yourhandle" },
];

function hslToHex(hsl: string): string {
  try {
    const parts = hsl.trim().split(/\s+/);
    const h = parseFloat(parts[0]) || 0;
    const s = (parseFloat(parts[1]) || 0) / 100;
    const l = (parseFloat(parts[2]) || 0) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch { return "#14b8a6"; }
}

function hexToHsl(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = ((b - r) / d + 2);
      else h = ((r - g) / d + 4);
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch { return "168 76% 50%"; }
}

export default function AdminSettings() {
  const { refetch } = useSiteSettings();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("key, value") as any;
      const map: Record<string, string> = {};
      (data as { key: string; value: string }[] || []).forEach((r) => (map[r.key] = r.value));
      setForm(map);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(form);
    let hasError = false;
    for (const [key, value] of entries) {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
      if (error) { toast.error(`Failed to save ${key}: ${error.message}`); hasError = true; }
    }
    if (!hasError) { toast.success("Settings saved successfully!"); refetch(); }
    setSaving(false);
  };

  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(key);
    const ext = file.name.split(".").pop();
    const path = `site/${key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(null); return; }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(f => ({ ...f, [key]: pub.publicUrl }));
    setUploading(null);
    toast.success("Image uploaded");
  };

  const renderField = (field: SettingField) => {
    const val = form[field.key] || "";

    if (field.type === "color-hsl") {
      return (
        <div className="space-y-1.5" key={field.key}>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={hslToHex(val)}
              onChange={e => setForm(f => ({ ...f, [field.key]: hexToHsl(e.target.value) }))}
              className="w-10 h-9 rounded-md border border-border cursor-pointer bg-secondary/50 shrink-0"
            />
            <Input
              value={val}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="bg-secondary/50 font-mono text-sm"
            />
          </div>
          {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          <div className="h-6 rounded-md" style={{ backgroundColor: `hsl(${val})` }} />
        </div>
      );
    }

    if (field.type === "url" && (field.key === "logo_url" || field.key === "favicon_url" || field.key === "og_image_url")) {
      return (
        <div className="space-y-1.5" key={field.key}>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</Label>
          <div className="flex gap-2 items-center">
            {val && (
              <img src={val} className="w-10 h-10 rounded-lg object-contain border border-border/50 bg-secondary/30 shrink-0" />
            )}
            <Input
              value={val}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="bg-secondary/50"
            />
            <label className="cursor-pointer shrink-0">
              <Button variant="outline" size="icon" asChild disabled={uploading === field.key} className="h-9 w-9">
                <span>{uploading === field.key ? "..." : <Upload className="h-4 w-4" />}</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(field.key, e)} />
            </label>
          </div>
          {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div className="space-y-1.5" key={field.key}>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {field.label} {field.key === "site_description" && <span className="text-muted-foreground/60">({val.length}/160)</span>}
          </Label>
          <Textarea
            value={val}
            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="bg-secondary/50"
            rows={3}
            maxLength={field.key === "site_description" ? 160 : undefined}
          />
          {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-1.5" key={field.key}>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</Label>
        <Input
          type={field.type === "email" ? "email" : "text"}
          value={val}
          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
          placeholder={field.placeholder}
          className="bg-secondary/50"
        />
        {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
      </div>
    );
  };

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 space-y-4"
    >
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            General Settings
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">Manage your website's branding, colors, and SEO</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 font-semibold shadow-lg shadow-primary/20">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <Section icon={Globe} title="Branding & Identity">
        {brandingFields.map(renderField)}
      </Section>

      <Section icon={Palette} title="Color Scheme">
        <p className="text-xs text-muted-foreground">Colors use HSL format. Use the color picker or type values manually. Changes apply instantly after saving.</p>
        {colorFields.map(renderField)}
      </Section>

      <Section icon={Image} title="SEO & Meta">
        {seoFields.map(renderField)}
      </Section>

      <Section icon={Share2} title="Social Links">
        {socialFields.map(renderField)}
      </Section>

      <Section icon={Code} title="Custom CSS">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom CSS Code</Label>
          <Textarea
            value={form.custom_css || ""}
            onChange={e => setForm(f => ({ ...f, custom_css: e.target.value }))}
            placeholder={`/* Custom styles */\n.my-class {\n  color: red;\n}`}
            className="bg-secondary/50 font-mono text-sm"
            rows={6}
          />
          <p className="text-xs text-muted-foreground">⚠️ Advanced: Custom CSS will be injected globally. Use carefully.</p>
        </div>
      </Section>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/20">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
