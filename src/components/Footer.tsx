import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-dark-teal text-dark-teal-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 text-xl font-bold mb-3">
              <span className="text-2xl">🕌</span>
              Hajj Wallet
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Save Together, Journey Together. A community-driven savings platform helping Muslims reach their Hajj goals.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/wallet" className="hover:opacity-100 transition-opacity">Wallet</Link></li>
              <li><Link to="/packages" className="hover:opacity-100 transition-opacity">Packages</Link></li>
              <li><Link to="/community" className="hover:opacity-100 transition-opacity">Community</Link></li>
              <li><Link to="/store" className="hover:opacity-100 transition-opacity">Store</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><span className="hover:opacity-100 cursor-pointer">Help Center</span></li>
              <li><span className="hover:opacity-100 cursor-pointer">Contact</span></li>
              <li><span className="hover:opacity-100 cursor-pointer">FAQs</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><span className="hover:opacity-100 cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:opacity-100 cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 text-center text-sm opacity-60">
          © {new Date().getFullYear()} Hajj Wallet. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
