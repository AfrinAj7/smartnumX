"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BuyButtonsProps {
  slug: string;
  title: string;
  price?: number;
  discountPrice?: number | null;
  isFree?: boolean;
  mode?: "ONLINE" | "PHYSICAL" | "BOTH";
  selectedMode?: "ONLINE" | "PHYSICAL";
  layout?: "row" | "column" | "card";
  showCart?: boolean;
  buyNowLabel?: string;
  seatsLeft?: number | null;
}

export function BuyButtons({
  slug,
  title,
  price,
  discountPrice,
  isFree = false,
  selectedMode = "ONLINE",
  layout = "row",
  showCart = true,
  buyNowLabel,
  seatsLeft,
}: BuyButtonsProps) {
  const [loadingAction, setLoadingAction] = useState<"cart" | "buyNow" | "free" | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isSoldOut = selectedMode === "PHYSICAL" && seatsLeft !== null && seatsLeft !== undefined && seatsLeft <= 0;

  async function handleAddToCart(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    if (isSoldOut) return;
    setLoadingAction("cart");
    setError(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: slug }),
      });

      if (res.status === 401) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(`/cart?added=${slug}`)}`);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not add to cart.");
      }

      setAdded(true);
      window.dispatchEvent(new Event("smartnum-cart-updated"));
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding to cart.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleBuyNow(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    if (isSoldOut) return;
    setLoadingAction("buyNow");
    setError(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: slug }),
      });

      if (res.status === 401) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent("/checkout")}`);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not proceed to checkout.");
      }

      window.dispatchEvent(new Event("smartnum-cart-updated"));
      router.push("/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error proceeding to checkout.");
      setLoadingAction(null);
    }
  }

  async function handleFreeEnroll(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    setLoadingAction("free");
    setError(null);

    try {
      const res = await fetch("/api/free-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (res.status === 401) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(`/test-series/${slug}?enrolled=true`)}`);
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not enroll in free product.");
      }

      if (json.data?.orderId) {
        router.push(`/orders/${json.data.orderId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enrolling in free test.");
      setLoadingAction(null);
    }
  }

  if (isFree || price === 0) {
    return (
      <div className={`buy-buttons-wrap ${layout}`}>
        <button
          type="button"
          onClick={handleFreeEnroll}
          disabled={loadingAction === "free"}
          className="btn-free-enroll"
        >
          {loadingAction === "free" ? (
            <span>Enrolling in Test Series...</span>
          ) : (
            <>
              <span>✨</span>
              <span>{buyNowLabel || "Enroll Free (100% Free)"}</span>
              <span>→</span>
            </>
          )}
        </button>
        {error && <p className="buy-button-error">{error}</p>}
      </div>
    );
  }

  if (isSoldOut) {
    return (
      <div className={`buy-buttons-wrap ${layout}`}>
        <button type="button" disabled className="btn-sold-out">
          ⚠️ Batch Full (Centre Seats Filled)
        </button>
        <p className="buy-button-note">Online batch option is still open with full recordings and doubts.</p>
      </div>
    );
  }

  const effectivePrice = discountPrice && discountPrice < (price ?? 0) ? discountPrice : price;
  const defaultBuyLabel = buyNowLabel || (selectedMode === "PHYSICAL" ? "Enrol / Book Centre Seat" : "Buy Now");

  return (
    <div className={`buy-buttons-wrap ${layout}`}>
      <div className="buy-buttons-actions">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={loadingAction !== null}
          className="btn-buy-now"
          title={`Buy ${title}`}
        >
          {loadingAction === "buyNow" ? (
            <span>Initiating Checkout...</span>
          ) : (
            <>
              <span>⚡</span>
              <span>{defaultBuyLabel}</span>
              {effectivePrice !== undefined && effectivePrice > 0 && (
                <span className="btn-price-chip">₹{effectivePrice.toLocaleString("en-IN")}</span>
              )}
            </>
          )}
        </button>

        {showCart && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loadingAction !== null}
            className={`btn-add-cart ${added ? "is-added" : ""}`}
            title="Add to Cart"
          >
            {loadingAction === "cart" ? (
              <span>Adding...</span>
            ) : added ? (
              <span>✓ In Cart</span>
            ) : (
              <>
                <span>🛒</span>
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="buy-button-error">{error}</p>}
    </div>
  );
}

