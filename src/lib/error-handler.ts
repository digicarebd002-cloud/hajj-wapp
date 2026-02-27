import { toast } from "@/hooks/use-toast";

type ErrorType =
  | "network"
  | "auth"
  | "payment_declined"
  | "insufficient_balance"
  | "rls"
  | "validation"
  | "unknown";

function classifyError(error: any): ErrorType {
  const msg = typeof error === "string" ? error : error?.message ?? error?.code ?? "";
  const status = error?.status ?? error?.statusCode ?? 0;

  if (status === 401 || status === 403 || /jwt|auth|not authenticated|login/i.test(msg)) {
    return status === 403 || /row.level.security|permission/i.test(msg) ? "rls" : "auth";
  }
  if (/payment.*declined|card.*declined|insufficient.*funds/i.test(msg)) return "payment_declined";
  if (/insufficient.*balance/i.test(msg)) return "insufficient_balance";
  if (/network|fetch|timeout|ERR_NETWORK|ECONNREFUSED|Failed to fetch/i.test(msg)) return "network";
  if (/validation|invalid|required|too short|too long/i.test(msg)) return "validation";
  return "unknown";
}

interface HandleErrorOptions {
  /** Override auto-detected error type */
  type?: ErrorType;
  /** Custom description to append */
  description?: string;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Navigate function for auth redirects */
  navigate?: (path: string) => void;
  /** Current path to preserve as returnTo */
  returnTo?: string;
}

/**
 * Global error handler — shows appropriate toast by error type.
 * Returns the classified error type for conditional UI (e.g., showing CTAs).
 */
export function handleAppError(error: any, options: HandleErrorOptions = {}): ErrorType {
  const errorType = options.type ?? classifyError(error);

  switch (errorType) {
    case "network":
      toast({
        title: "Connection failed",
        description: options.description ?? "Please check your connection and try again.",
        variant: "destructive",
      });
      break;

    case "auth":
      toast({
        title: "Session expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      if (options.navigate) {
        options.navigate(`/auth${options.returnTo ? `?returnTo=${encodeURIComponent(options.returnTo)}` : ""}`);
      }
      break;

    case "rls":
      toast({
        title: "Permission denied",
        description: options.description ?? "You don't have permission to perform this action.",
        variant: "destructive",
      });
      break;

    case "payment_declined":
      toast({
        title: "Payment declined",
        description: options.description ?? "Please check your card details and try again.",
        variant: "destructive",
      });
      break;

    case "insufficient_balance":
      toast({
        title: "Insufficient balance",
        description: options.description ?? "Your wallet balance is too low. Add funds first.",
        variant: "destructive",
      });
      break;

    case "validation":
      toast({
        title: "Validation error",
        description: options.description ?? (typeof error === "string" ? error : error?.message ?? "Please check your input."),
        variant: "destructive",
      });
      break;

    default:
      toast({
        title: "Something went wrong",
        description: options.description ?? (typeof error === "string" ? error : error?.message ?? "Please try again."),
        variant: "destructive",
      });
  }

  return errorType;
}

/**
 * Wraps an async action with loading state and global error handling.
 * Returns { success, errorType } so callers can react (e.g., show CTA).
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  options: HandleErrorOptions = {}
): Promise<{ success: boolean; data?: T; errorType?: ErrorType }> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (err) {
    const errorType = handleAppError(err, options);
    return { success: false, errorType };
  }
}
