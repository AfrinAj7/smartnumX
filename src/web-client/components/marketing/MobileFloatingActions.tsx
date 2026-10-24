"use client";

import Image from "next/image";
import { useState } from "react";

type MobileFloatingActionsProps = {
  phone: string;
  whatsappNumber?: string;
};

const TAP_HERE_GIF =
  "https://static.vecteezy.com/system/resources/previews/070/173/733/non_2x/green-telephone-receiver-with-yellow-signal-waves-isolated-on-transparent-background-for-communication-and-contact-purposes-in-a-modern-design-free-png.png";

export function MobileFloatingActions({ phone, whatsappNumber }: MobileFloatingActionsProps) {
  const [open, setOpen] = useState(false);
  const whatsappDigits = whatsappNumber?.replace(/\D/g, "");
  const phoneDigits = phone.replace(/[^+\d]/g, "");

  return (
    <div
      className={`floating-action-widget ${open ? "is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Slide-in Quick Menu */}
      <div className="floating-menu-slide" aria-hidden={!open}>
        <a className="floating-menu-item item-demo" href="#book-demo" onClick={() => setOpen(false)}>
          <span className="item-icon">
            <Image
              src="https://static.wixstatic.com/media/8db5b7_b96cea69c9564e1f86469277f901163b~mv2.gif"
              alt="Demo icon"
              width={24}
              height={24}
              unoptimized
            />
          </span>
          <span className="item-label">Book Free Demo</span>
        </a>
        <a className="floating-menu-item item-call" href={`tel:${phoneDigits}`} onClick={() => setOpen(false)}>
          <span className="item-icon">
            <Image
              src="https://cdn-icons-png.flaticon.com/256/8705/8705273.png"
              alt="Call icon"
              width={24}
              height={24}
              unoptimized
            />
          </span>
          <span className="item-label">Call Center</span>
        </a>
        {whatsappDigits && (
          <a
            className="floating-menu-item item-whatsapp"
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <span className="item-icon">
              <Image
                src="https://static.vecteezy.com/system/resources/previews/059/285/595/non_2x/whatsapp-business-app-icon-transparent-background-free-png.png"
                alt="WhatsApp icon"
                width={24}
                height={24}
                unoptimized
              />
            </span>
            <span className="item-label">WhatsApp Chat</span>
          </a>
        )}
      </div>

      {/* Main Circular Floating Trigger Button */}
      <button
        type="button"
        className="floating-trigger-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Contact and quick actions menu"
        aria-expanded={open}
      >
        {open ? (
          <span className="trigger-icon">✕</span>
        ) : (
          <Image
            className="trigger-gif"
            src={TAP_HERE_GIF}
            alt="Tap Here"
            width={38}
            height={38}
            unoptimized
          />
        )}
        {!open && <span className="trigger-pulse" />}
      </button>
    </div>
  );
}
