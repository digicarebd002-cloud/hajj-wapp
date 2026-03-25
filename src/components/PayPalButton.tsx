import { useEffect, useRef, useState } from "react";
import { usePayPal } from "@/hooks/use-paypal";
import { Loader2 } from "lucide-react";

interface PayPalButtonProps {
  amount: number;
  description: string;
  type: "wallet" | "booking" | "order" | "membership";
  metadata?: Record<string, any>;
  captureExtra?: Record<string, any>;
  onSuccess: (result: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function PayPalButton({
  amount,
  description,
  type,
  metadata,
  captureExtra,
  onSuccess,
  onError,
  disabled,
  className = "",
}: PayPalButtonProps) {
  const { ready, loading, error, createOrder, captureOrder } = usePayPal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!ready || !containerRef.current || rendered || disabled || amount <= 0) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    // Clear previous buttons
    containerRef.current.innerHTML = "";

    paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          height: 45,
        },
        createOrder: async () => {
          return await createOrder(amount, description, { type, ...metadata });
        },
        onApprove: async (data: any) => {
          try {
            const result = await captureOrder(data.orderID, type, captureExtra);
            onSuccess(result);
          } catch (err: any) {
            onError?.(err.message);
          }
        },
        onError: (err: any) => {
          console.error("PayPal error:", err);
          onError?.("Payment failed. Please try again.");
        },
        onCancel: () => {
          // User closed PayPal popup
        },
      })
      .render(containerRef.current)
      .then(() => setRendered(true));
  }, [ready, amount, disabled, rendered, type]);

  // Re-render buttons when amount changes
  useEffect(() => {
    setRendered(false);
  }, [amount]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading PayPal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-3 text-sm text-muted-foreground ${className}`}>
        PayPal unavailable: {error}
      </div>
    );
  }

  return <div ref={containerRef} className={`min-h-[50px] ${className}`} />;
}
