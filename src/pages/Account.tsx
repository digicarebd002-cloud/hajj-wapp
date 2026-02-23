import { User, Mail, Phone, MapPin, Shield, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const Account = () => {
  return (
    <div className="section-padding bg-secondary min-h-screen">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-2">
          My Account
        </h1>
        <p className="text-muted-foreground mb-8">Manage your profile and preferences.</p>

        {/* Profile Card */}
        <div className="bg-card rounded-xl p-6 card-shadow mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">Guest User</h2>
              <p className="text-sm text-muted-foreground">Sign in to access your account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Full Name
              </label>
              <Input placeholder="Enter your name" />
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email
              </label>
              <Input type="email" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> Phone
              </label>
              <Input type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Location
              </label>
              <Input placeholder="City, Country" />
            </div>
            <Button className="w-full mt-2">Save Changes</Button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-xl p-6 card-shadow mb-6">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Savings Reminders</p>
                <p className="text-xs text-muted-foreground">Get notified about your contribution schedule</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Community Updates</p>
                <p className="text-xs text-muted-foreground">New posts and replies in community</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Package Deals</p>
                <p className="text-xs text-muted-foreground">Special offers and new packages</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Security
          </h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Shield className="h-4 w-4" /> Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
