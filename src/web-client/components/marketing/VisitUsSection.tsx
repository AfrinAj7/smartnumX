import type { HomepageContent } from "@/server/site-content/homepage";

type ContactDetails = HomepageContent["contact"];

export function VisitUsSection({ contact }: { contact: ContactDetails }) {
  const address = contact.address || "04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014";
  const primaryPhone = contact.phone || "+91 99589 47774";
  const secondaryPhone = contact.secondaryPhone || "+91 88004 05640";
  const email = contact.email || "gosmartnum@gmail.com";
  const whatsapp = contact.whatsapp || "+91 99589 47774";
  const whatsappDigits = whatsapp.replace(/\D/g, "");

  const encodedAddress = encodeURIComponent(address);
  const mapsSearchUrl = contact.mapsUrl || "https://share.google/8gHRuZQQxRuYAkqVd";

  return (
    <section className="visit-us-section section-wrap" id="visit-us" aria-labelledby="visit-title">
      <div className="section-heading">
        <span className="section-kicker">Visit SmartNum</span>
        <h2 id="visit-title">Our Learning Space in Indirapuram</h2>
        <p>Drop by our campus, speak with our educators, and explore our CCTV-enabled smart classrooms.</p>
      </div>

      <div className="visit-us-grid">
        <div className="visit-info-card">
          <div className="visit-info-item">
            <span className="visit-icon" aria-hidden="true">📍</span>
            <div>
              <h3>Center Address</h3>
              <p>{address}</p>
              <a
                className="text-link visit-map-link"
                href={mapsSearchUrl}
                target="_blank"
                rel="noreferrer"
              >
                Get Directions on Google Maps <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="visit-info-item">
            <span className="visit-icon" aria-hidden="true">📞</span>
            <div>
              <h3>Phone &amp; WhatsApp</h3>
              <p>
                <a href={`tel:${primaryPhone.replace(/[^+\d]/g, "")}`}>{primaryPhone}</a>
                <br />
                <a href={`tel:${secondaryPhone.replace(/[^+\d]/g, "")}`}>{secondaryPhone}</a>
              </p>
              {whatsappDigits && (
                <a
                  className="text-link"
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>

          <div className="visit-info-item">
            <span className="visit-icon" aria-hidden="true">✉️</span>
            <div>
              <h3>Email &amp; Queries</h3>
              <p><a href={`mailto:${email}`}>{email}</a></p>
              <p className="visit-hours">Monday – Saturday: 9:00 AM – 8:00 PM</p>
            </div>
          </div>

          <div className="visit-social-block">
            <h3>Follow SmartNum</h3>
            <div className="visit-social-links">
              {contact.instagramUrl && (
                <a href={contact.instagramUrl} target="_blank" rel="noreferrer" aria-label="SmartNum Instagram">
                  Instagram
                </a>
              )}
              {contact.facebookUrl && (
                <a href={contact.facebookUrl} target="_blank" rel="noreferrer" aria-label="SmartNum Facebook">
                  Facebook
                </a>
              )}
              {contact.youtubeUrl && (
                <a href={contact.youtubeUrl} target="_blank" rel="noreferrer" aria-label="SmartNum YouTube">
                  YouTube
                </a>
              )}
              {contact.linkedInUrl && (
                <a href={contact.linkedInUrl} target="_blank" rel="noreferrer" aria-label="SmartNum LinkedIn">
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="visit-map-container">
          <iframe
            title="SmartNum Location Map"
            src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "340px", borderRadius: "16px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
