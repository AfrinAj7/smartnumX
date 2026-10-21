import Image from "next/image";
import Link from "next/link";

export function SmartNumWordmark({ suffix = "Learning" }: { suffix?: string }) {
  return (
    <Link className="brand-wordmark" href="/" aria-label={`SmartNum ${suffix} home`}>
      <Image
        className="brand-wordmark-image"
        src="/SmartNum%20Math%20Wave%20Logo.png"
        alt="SmartNum Math Wave"
        width={600}
        height={240}
        priority
      />
      <span className="brand-wordmark-suffix">{suffix}</span>
    </Link>
  );
}