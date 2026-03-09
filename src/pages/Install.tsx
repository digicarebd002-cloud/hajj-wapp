import { usePWAInstall, usePushNotifications, useOnlineStatus } from "@/hooks/use-pwa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, Bell, BellOff, Wifi, WifiOff, Check, Smartphone, Share, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

const Install = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const isOnline = useOnlineStatus();

  const handleInstall = async () => {
    await install();
  };

  const handleNotificationToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Smartphone className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">অ্যাপ ইনস্টল করুন</h1>
        <p className="text-muted-foreground">
          Hajj Wallet আপনার ফোনে ইনস্টল করুন — অফলাইনেও ব্যবহার করুন
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* Install Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">অ্যাপ ইনস্টল</h3>
                  {isInstalled ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">ইতিমধ্যে ইনস্টল হয়েছে!</span>
                    </div>
                  ) : isInstallable ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        হোম স্ক্রিনে যোগ করুন — নেটিভ অ্যাপের মতো কাজ করবে
                      </p>
                      <Button onClick={handleInstall} className="rounded-full gap-2">
                        <Download className="h-4 w-4" />
                        ইনস্টল করুন
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        ব্রাউজার মেনু থেকে ইনস্টল করুন:
                      </p>
                      <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">iOS</div>
                          <div className="text-sm text-foreground">
                            <Share className="h-3.5 w-3.5 inline mr-1" />
                            Share → <strong>"Add to Home Screen"</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">And</div>
                          <div className="text-sm text-foreground">
                            Menu (⋮) → <strong>"Install App"</strong> বা <strong>"Add to Home Screen"</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Push Notifications Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  {isSubscribed ? <Bell className="h-6 w-6 text-primary" /> : <BellOff className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground">পুশ নোটিফিকেশন</h3>
                    <Switch
                      checked={isSubscribed}
                      onCheckedChange={handleNotificationToggle}
                      disabled={permission === "denied"}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {permission === "denied"
                      ? "নোটিফিকেশন ব্লক করা আছে — ব্রাউজার সেটিংস থেকে অনুমতি দিন"
                      : isSubscribed
                        ? "আপনি নোটিফিকেশন পাবেন — ওয়ালেট আপডেট, অর্ডার, কমিউনিটি"
                        : "ওয়ালেট আপডেট, অর্ডার স্ট্যাটাস, এবং কমিউনিটি আপডেট পান"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offline Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOnline ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {isOnline ? <Wifi className="h-6 w-6 text-primary" /> : <WifiOff className="h-6 w-6 text-destructive" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">অফলাইন মোড</h3>
                  <p className="text-sm text-muted-foreground">
                    {isOnline
                      ? "আপনি অনলাইন আছেন। অ্যাপটি অফলাইনেও কাজ করবে — আগে দেখা পেজগুলো ক্যাশ থেকে লোড হবে।"
                      : "আপনি অফলাইন আছেন। ক্যাশ করা ডেটা দেখানো হচ্ছে — ইন্টারনেট ফিরে আসলে অটোমেটিক সিঙ্ক হবে।"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border bg-secondary/30">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">অ্যাপ ইনস্টলের সুবিধা</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "হোম স্ক্রিন থেকে সরাসরি ওপেন",
                  "ফুলস্ক্রিন অভিজ্ঞতা",
                  "অফলাইনে ব্রাউজ করুন",
                  "দ্রুত লোডিং স্পিড",
                  "পুশ নোটিফিকেশন",
                  "কম ডেটা ব্যবহার",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Install;
