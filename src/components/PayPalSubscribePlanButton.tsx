import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

// Live subscription plan from PayPal (the mandatory $15/mo wallet membership).
// This uses PayPal's hosted plan flow — separate from the wallet/order/booking
// PayPal credentials configured in the admin panel.
const SUBSCRIPTION_PLAN_ID = "P-1D83979625931534RNHYMMPQ";
const SUBSCRIPTION_CLIENT_ID =
  "AcuG6DcljT1pJsaF66gNFw3ZlNkbgV5wfZqzl5djVfFBZ--BcsUHURWtU9IgD9VypaDv_JH47dFJFgRA";

const SDK_SRC = `https://www.paypal.com/sdk/js?client-id=${SUBSCRIPTION_CLIENT_ID}&vault=true&intent=subscription`;

let sdkPromise: Promise<void> | null = null;

function loadSubscriptionSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    // If a different paypal SDK was already loaded (e.g. for one-time payments),
    // we still need a separate script tag with vault+subscription intent.
    const existing = document.querySelector(
      `script[data-paypal-subscription="true"]`
    ) as HTMLScriptElement | null;

    if (existing && (window as any).paypal?.Buttons) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.dataset.paypalSubscription = "true";
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal subscription SDK"));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

interface Props {
  onApproved: (subscriptionId: string) => void | Promise<void>;
  disabled?: boolean;
}

export default function PayPalSubscribePlanButton({ onApproved, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    loadSubscriptionSdk()
      .then(() => {
        if (cancelled || !containerRef.current || renderedRef.current) return;
        const paypal = (window as any).paypal;
        if (!paypal?.Buttons) {
          setError("PayPal SDK unavailable");
          setLoading(false);
          return;
        }

        containerRef.current.innerHTML = "";

        paypal
          .Buttons({
            style: {
              shape: "pill",
              color: "gold",
              layout: "vertical",
              label: "subscribe",
            },
            createSubscription: (_data: any, actions: any) =>
              actions.subscription.create({ plan_id: SUBSCRIPTION_PLAN_ID }),
            onApprove: async (data: any) => {
              try {
                await onApproved(data.subscriptionID);
              } catch (err) {
                console.error("Subscription approval handling failed:", err);
              }
            },
            onError: (err: any) => {
              console.error("PayPal subscription error:", err);
              setError("Subscription failed. Please try again.");
            },
          })
          .render(containerRef.current)
          .then(() => {
            renderedRef.current = true;
            setLoading(false);
          })
          .catch((err: any) => {
            console.error(err);
            setError("Could not render PayPal button");
            setLoading(false);
          });
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onApproved]);

  return (
    <div className="w-full">
      {loading && (
        <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading PayPal…
        </div>
      )}
      {error && (
        <div className="text-center py-2 text-sm text-destructive">{error}</div>
      )}
      <div
        ref={containerRef}
        className={`min-h-[50px] ${disabled ? "pointer-events-none opacity-60" : ""}`}
      />
    </div>
  );
}
