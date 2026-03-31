import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Palette, Globe, Share2, Code, Save, Upload, Image, CreditCard, Eye, EyeOff, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Switch } from "@/components/ui/switch";

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
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

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

  const renderSecretField = (key: string, label: string, placeholder: string) => {
    const val = form[key] || "";
    const isVisible = showSecrets[key];
    return (
      <div className="space-y-1.5" key={key}>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
        <div className="flex gap-2 items-center">
          <Input
            type={isVisible ? "text" : "password"}
            value={val}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className="bg-secondary/50 font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setShowSecrets(s => ({ ...s, [key]: !s[key] }))}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
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

      {/* ===== STRIPE ===== */}
      <Section icon={CreditCard} title="💳 Stripe Integration">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Enable Stripe</Label>
            <p className="text-xs text-muted-foreground">Accept payments via Stripe</p>
          </div>
          <Switch
            checked={form.stripe_enabled === "true"}
            onCheckedChange={v => setForm(f => ({ ...f, stripe_enabled: v ? "true" : "false" }))}
          />
        </div>

        {form.stripe_enabled === "true" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mode</Label>
              <div className="flex gap-2">
                {["test", "live"].map(mode => (
                  <Button
                    key={mode}
                    variant={form.stripe_mode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm(f => ({ ...f, stripe_mode: mode }))}
                    className="capitalize"
                  >
                    {mode === "test" ? "🧪 Test" : "🟢 Live"}
                  </Button>
                ))}
              </div>
            </div>

            {form.stripe_mode === "test" ? (
              <>
                {renderSecretField("stripe_test_publishable_key", "Test Publishable Key", "pk_test_...")}
                {renderSecretField("stripe_test_secret_key", "Test Secret Key", "sk_test_...")}
              </>
            ) : (
              <>
                {renderSecretField("stripe_live_publishable_key", "Live Publishable Key", "pk_live_...")}
                {renderSecretField("stripe_live_secret_key", "Live Secret Key", "sk_live_...")}
              </>
            )}
            {renderSecretField("stripe_webhook_secret", "Webhook Secret", "whsec_...")}
          </div>
        )}
      </Section>

      {/* ===== PAYPAL ===== */}
      <Section icon={CreditCard} title="🅿️ PayPal Integration">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Enable PayPal</Label>
            <p className="text-xs text-muted-foreground">Accept payments via PayPal</p>
          </div>
          <Switch
            checked={form.paypal_enabled === "true"}
            onCheckedChange={v => setForm(f => ({ ...f, paypal_enabled: v ? "true" : "false" }))}
          />
        </div>

        {form.paypal_enabled === "true" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mode</Label>
              <div className="flex gap-2">
                {["sandbox", "live"].map(mode => (
                  <Button
                    key={mode}
                    variant={form.paypal_mode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm(f => ({ ...f, paypal_mode: mode }))}
                    className="capitalize"
                  >
                    {mode === "sandbox" ? "🧪 Sandbox" : "🟢 Live"}
                  </Button>
                ))}
              </div>
            </div>

            {form.paypal_mode === "sandbox" ? (
              <>
                {renderSecretField("paypal_sandbox_client_id", "Sandbox Client ID", "AXxx...")}
                {renderSecretField("paypal_sandbox_secret", "Sandbox Secret", "ELxx...")}
              </>
            ) : (
              <>
                {renderSecretField("paypal_live_client_id", "Live Client ID", "AXxx...")}
                {renderSecretField("paypal_live_secret", "Live Secret", "ELxx...")}
              </>
            )}
          </div>
        )}
      </Section>

      {/* ===== WALLET SUBSCRIPTION ===== */}
      <Section icon={Crown} title="💳 Wallet Subscription">
        <p className="text-xs text-muted-foreground">Users must subscribe monthly to add funds to their wallet. This fee is a service charge, not added to their balance.</p>
        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm font-semibold">Enable Wallet Subscription</Label>
            <p className="text-xs text-muted-foreground">Require subscription to add wallet funds</p>
          </div>
          <Switch
            checked={form.wallet_subscription_enabled !== "false"}
            onCheckedChange={v => setForm(f => ({ ...f, wallet_subscription_enabled: v ? "true" : "false" }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Price (USD)</Label>
          <Input
            type="number"
            value={form.wallet_subscription_price || "15"}
            onChange={e => setForm(f => ({ ...f, wallet_subscription_price: e.target.value }))}
            placeholder="15"
            className="bg-secondary/50 font-mono text-sm max-w-[200px]"
            min="1"
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">⚠️ Changing this price will only affect new subscriptions. Existing subscriptions keep their original rate until renewed.</p>
        </div>
      </Section>

      {/* ===== PAYMENT OPTIONS ===== */}
      <Section icon={ToggleLeft} title="⚙️ Payment Features">
        <p className="text-xs text-muted-foreground">Enable or disable payment for specific features</p>
        {[
          { key: "payment_wallet_topup", label: "Wallet Top-up", desc: "Allow users to add funds to their Hajj wallet" },
          { key: "payment_store_checkout", label: "Store Checkout", desc: "Accept payments for store purchases" },
          { key: "payment_package_booking", label: "Package Booking", desc: "Accept payments for Hajj package bookings" },
        ].map(opt => (
          <div key={opt.key} className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm font-semibold">{opt.label}</Label>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
            <Switch
              checked={form[opt.key] !== "false"}
              onCheckedChange={v => setForm(f => ({ ...f, [opt.key]: v ? "true" : "false" }))}
            />
          </div>
        ))}
      </Section>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/20">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
