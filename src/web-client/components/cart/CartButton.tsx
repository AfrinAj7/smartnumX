"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CartButton() {
  const [itemCount, setItemCount] = useState<number>(0);

  async function fetchCount() {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        setItemCount(json.data?.itemCount || 0);
      }
    } catch {
      // Ignore background error if guest
    }
  }

  useEffect(() => {
    fetchCount();

    function handleCartUpdate() {
      fetchCount();
    }

    window.addEventListener("smartnum-cart-updated", handleCartUpdate);
    return () => window.removeEventListener("smartnum-cart-updated", handleCartUpdate);
  }, []);

  return (
    <Link
      href="/cart"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "38px",
        height: "38px",
        borderRadius: "0.5rem",
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        color: "#1e293b",
        textDecoration: "none",
        transition: "all 0.15s ease",
      }}
      title="View Course Cart"
      aria-label={`View Cart (${itemCount} items)`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>

      {itemCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            backgroundColor: "#ea580c",
            color: "#ffffff",
            fontSize: "0.6875rem",
            fontWeight: 700,
            width: "18px",
            height: "18px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
