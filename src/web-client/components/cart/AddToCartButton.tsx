"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  courseSlug: string;
  courseTitle?: string;
  price?: number;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "hero";
}

export function AddToCartButton({
  courseSlug,
  courseTitle,
  price,
  label = "Enroll Now (Instant Demo)",
  className = "",
  variant = "primary",
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleAddToCart() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });

      if (res.status === 401) {
        // Redirect to sign in with return callback
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(`/cart?added=${courseSlug}`)}`);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not add course to cart.");
      }

      setStatus("added");
      window.dispatchEvent(new Event("smartnum-cart-updated"));
      // Short delay then navigate to cart
      setTimeout(() => {
        router.push("/cart");
      }, 400);
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to add course.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: variant === "hero" ? "0.875rem 1.75rem" : "0.75rem 1.25rem",
    borderRadius: "0.5rem",
    fontSize: variant === "hero" ? "1rem" : "0.9375rem",
    fontWeight: 700,
    cursor: loading ? "wait" : "pointer",
    transition: "all 0.2s ease",
    border: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    backgroundColor: status === "added" ? "#16a34a" : "#ea580c",
    color: "#ffffff",
  };

  return (
    <div style={{ display: "inline-block" }}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className={className}
        style={baseStyle}
        aria-label={`Enroll in ${courseTitle || courseSlug}`}
      >
        {loading ? (
          <span>Adding to Cart...</span>
        ) : status === "added" ? (
          <span>✓ Added! Opening Cart...</span>
        ) : (
          <>
            <span>🛒</span>
            <span>{label}</span>
            {price !== undefined && price > 0 && <span>· ₹{price.toLocaleString("en-IN")}</span>}
          </>
        )}
      </button>

      {errorMessage && (
        <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem", fontWeight: 500 }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
