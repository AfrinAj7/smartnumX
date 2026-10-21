"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import type { HomepageContent } from "@/server/site-content/homepage";

type ListSection = "heroSlides" | "metrics" | "features" | "programs" | "plans" | "curricula" | "faculty" | "testimonials" | "faqs" | "demoVideos";
type ObjectItem = Record<string, string | boolean | string[]>;

const sections: Array<{ id: string; label: string }> = [
  { id: "general", label: "Brand & contact" },
  { id: "hero", label: "Hero slides" },
  { id: "proof", label: "Trust & about" },
  { id: "programmes", label: "Programmes & curricula" },
  { id: "faculty", label: "Faculty & testimonials" },
  { id: "media", label: "Demo videos" },
  { id: "faq", label: "FAQs" },
];

const templates: Partial<Record<ListSection, ObjectItem>> = {
  heroSlides: { eyebrow: "SMARTNUM · MATHEMATICS", headline: "New SmartNum programme", copy: "Edit this message before publishing.", primaryLabel: "Explore programmes", secondaryLabel: "Book an assessment", imageUrl: "", imageAlt: "" },
  metrics: { value: "", label: "New metric", verified: false },
  features: { title: "New learning feature", description: "Describe only a confirmed SmartNum service." },
  programs: { title: "New programme", badge: "GRADES 9–12", icon: "🎓", description: "Programme details to confirm.", offerBadge: "Free Demo Class Available", imageUrl: "", enabled: false },
  plans: { title: "New plan", price: "[PRICE TO CONFIRM]", description: "Plan details to confirm.", inclusions: [], enabled: false },
  curricula: { title: "New curriculum", summary: "Coverage to confirm.", strengths: [], imageUrl: "", altText: "", badge: "", enabled: false },
  faculty: { name: "", subject: "", qualification: "", experience: "", photoUrl: "", approved: false },
  testimonials: { quote: "", name: "", learnerClass: "", relation: "Parent", approved: false },
  faqs: { question: "", answer: "", published: false },
  demoVideos: { title: "", subject: "", classLabel: "", videoUrl: "", thumbnailUrl: "", altText: "", published: false },
};

function TextField({ label, value, onChange, multiline = false, placeholder = "" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      {multiline
        ? <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={3} />
        : <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="cms-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function SiteContentEditor({ initialContent }: { initialContent: HomepageContent }) {
  const [content, setContent] = useState(initialContent);
  const [activeSection, setActiveSection] = useState("general");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  function updateContact(key: keyof HomepageContent["contact"], value: string) {
    setContent((current) => ({ ...current, contact: { ...current.contact, [key]: value } }));
    setNotice("");
  }

  function updateItem(section: ListSection, index: number, key: string, value: string | boolean | string[]) {
    setContent((current) => {
      const list = [...current[section]] as ObjectItem[];
      list[index] = { ...list[index], [key]: value };
      return { ...current, [section]: list } as HomepageContent;
    });
    setNotice("");
  }

  function addItem(section: ListSection) {
    const template = templates[section];
    if (!template) return;
    setContent((current) => ({ ...current, [section]: [...current[section], { ...template }] }) as HomepageContent);
    setNotice("");
  }

  function removeItem(section: ListSection, index: number) {
    setContent((current) => ({ ...current, [section]: current[section].filter((_, itemIndex) => itemIndex !== index) }) as HomepageContent);
    setNotice("");
  }

  async function uploadMedia(section: "heroSlides" | "programs" | "curricula" | "faculty" | "demoVideos", index: number, field: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(`${section}-${index}-${field}`);
    setError("");
    setNotice("");
    try {
      const signResponse = await fetch("/api/admin/media-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new Error(signed.error ?? "Could not prepare the upload.");

      const uploadResponse = await fetch(signed.data.uploadUrl, {
        method: "PUT",
        headers: signed.data.requiredHeaders,
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Upload failed. Check storage bucket CORS and try again.");

      updateItem(section, index, field, signed.data.mediaUrl);
      setNotice("Media uploaded. Save homepage changes to publish the new URL.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  async function saveContent() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Could not save homepage content.");
      setContent(result.data);
      setNotice("Homepage content saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  function renderAssetUpload(section: "heroSlides" | "programs" | "curricula" | "faculty" | "demoVideos", index: number, field: string, label: string, currentUrl?: string) {
    const key = `${section}-${index}-${field}`;
    const accepts = section === "demoVideos" && field === "videoUrl" ? "video/mp4" : "image/jpeg,image/png,image/webp,image/avif";
    const isVideoField = section === "demoVideos" && field === "videoUrl";

    return (
      <div className="cms-upload-field">
        <label className="cms-field">
          <span>{label} (Direct URL or Link)</span>
          <input
            type="url"
            value={currentUrl || ""}
            placeholder={isVideoField ? "https://www.youtube.com/watch?v=... or MP4 URL" : "https://images.unsplash.com/... or /image.jpg"}
            onChange={(event) => updateItem(section, index, field, event.target.value)}
          />
        </label>
        <div className="cms-upload-secondary">
          <label className="cms-upload-control">
            <span>{uploading === key ? "Uploading…" : "Or Upload File from Computer"}</span>
            <input type="file" accept={accepts} disabled={Boolean(uploading)} onChange={(event) => uploadMedia(section, index, field, event)} />
          </label>
          <span className="cms-hint">Paste any HTTPS link above. Cloud storage upload is optional.</span>
        </div>
        {!isVideoField && currentUrl && (
          <div className="cms-preview-wrapper">
            <span className="cms-hint">Preview:</span>
            <Image className="cms-media-preview" src={currentUrl} alt="Media preview" width={320} height={180} unoptimized />
          </div>
        )}
      </div>
    );
  }

  const activeLabel = sections.find((section) => section.id === activeSection)?.label ?? "Homepage content";

  return (
    <div className="cms-layout">
      <aside className="cms-sidebar" aria-label="Homepage content sections">
        <span className="cms-sidebar-title">Homepage</span>
        {sections.map((section) => (
          <button key={section.id} type="button" className={activeSection === section.id ? "cms-nav-item is-active" : "cms-nav-item"} onClick={() => setActiveSection(section.id)}>
            {section.label}
          </button>
        ))}
        <p className="cms-sidebar-note">Changes are saved to the shared public homepage settings.</p>
      </aside>

      <section className="cms-workspace" aria-labelledby="cms-title">
        <header className="cms-workspace-header">
          <div><span className="workspace-header-caption">SMARTNUM / SITE CONTENT</span><h2 id="cms-title">{activeLabel}</h2></div>
          <button className="button button-demo cms-save-button" type="button" onClick={saveContent} disabled={saving || Boolean(uploading)}>{saving ? "Saving…" : "Save changes"}</button>
        </header>

        {notice && <p className="cms-feedback cms-success" role="status">{notice}</p>}
        {error && <p className="cms-feedback cms-error" role="alert">{error}</p>}

        <div className="cms-editor-body">
          {activeSection === "general" && (
            <div className="cms-panel-grid">
              <article className="cms-panel">
                <h3>Brand and contact</h3>
                <TextField label="Site name" value={content.siteName} onChange={(value) => updateField("siteName", value)} />
                <TextField label="Brand unit / portal label" value={content.unitLabel} onChange={(value) => updateField("unitLabel", value)} />
                <TextField label="Tagline" value={content.tagline} onChange={(value) => updateField("tagline", value)} />
                <TextField label="Address" value={content.contact.address} onChange={(value) => updateContact("address", value)} multiline />
                <div className="cms-two-fields"><TextField label="Primary phone" value={content.contact.phone} onChange={(value) => updateContact("phone", value)} /><TextField label="Secondary phone" value={content.contact.secondaryPhone} onChange={(value) => updateContact("secondaryPhone", value)} /></div>
                <TextField label="Email" value={content.contact.email} onChange={(value) => updateContact("email", value)} />
                <TextField label="WhatsApp" value={content.contact.whatsapp} onChange={(value) => updateContact("whatsapp", value)} />
              </article>
              <article className="cms-panel">
                <h3>Social profiles</h3>
                <TextField label="Instagram URL" value={content.contact.instagramUrl} onChange={(value) => updateContact("instagramUrl", value)} />
                <TextField label="Facebook URL" value={content.contact.facebookUrl} onChange={(value) => updateContact("facebookUrl", value)} />
                <TextField label="YouTube URL" value={content.contact.youtubeUrl} onChange={(value) => updateContact("youtubeUrl", value)} />
                <TextField label="LinkedIn URL" value={content.contact.linkedInUrl} onChange={(value) => updateContact("linkedInUrl", value)} />
                <p className="cms-hint">The homepage reads these saved values. Contact fields supplied by SmartNum are prefilled; update them here when needed.</p>
              </article>
            </div>
          )}

          {activeSection === "hero" && (
            <div className="cms-list-editor">
              <p className="cms-hint">Up to three slides. Keep claims verifiable; slides rotate on the public homepage.</p>
              {content.heroSlides.map((slide, index) => <article className="cms-panel" key={`hero-${index}`}>
                <div className="cms-card-heading"><h3>Slide {index + 1}</h3>{content.heroSlides.length > 1 && <button className="cms-remove" type="button" onClick={() => removeItem("heroSlides", index)}>Remove slide</button>}</div>
                <TextField label="Eyebrow" value={slide.eyebrow} onChange={(value) => updateItem("heroSlides", index, "eyebrow", value)} />
                <TextField label="Headline" value={slide.headline} onChange={(value) => updateItem("heroSlides", index, "headline", value)} />
                <TextField label="Supporting copy" value={slide.copy} onChange={(value) => updateItem("heroSlides", index, "copy", value)} multiline />
                <div className="cms-two-fields"><TextField label="Primary CTA label" value={slide.primaryLabel} onChange={(value) => updateItem("heroSlides", index, "primaryLabel", value)} /><TextField label="Secondary CTA label" value={slide.secondaryLabel} onChange={(value) => updateItem("heroSlides", index, "secondaryLabel", value)} /></div>
                {renderAssetUpload("heroSlides", index, "imageUrl", "Upload hero image", slide.imageUrl)}
                <TextField label="Image alt text" value={slide.imageAlt} onChange={(value) => updateItem("heroSlides", index, "imageAlt", value)} />
              </article>)}
              {content.heroSlides.length < 3 && <button className="button button-secondary" type="button" onClick={() => addItem("heroSlides")}>Add hero slide</button>}
            </div>
          )}

          {activeSection === "proof" && (
            <div className="cms-panel-grid">
              <article className="cms-panel"><div className="cms-card-heading"><h3>Trust metrics</h3><button className="cms-add" type="button" onClick={() => addItem("metrics")}>Add metric</button></div>
                {content.metrics.map((metric, index) => <div className="cms-list-row" key={`metric-${index}`}><TextField label="Value" value={metric.value} onChange={(value) => updateItem("metrics", index, "value", value)} /><TextField label="Label" value={metric.label} onChange={(value) => updateItem("metrics", index, "label", value)} /><ToggleField label="Verified by owner" checked={metric.verified} onChange={(value) => updateItem("metrics", index, "verified", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("metrics", index)}>Remove</button></div>)}
              </article>
              <article className="cms-panel"><h3>About SmartNum</h3><TextField label="Section heading" value={content.aboutHeadline} onChange={(value) => updateField("aboutHeadline", value)} />
                {content.aboutParagraphs.map((paragraph, index) => <TextField key={`about-${index}`} label={`Paragraph ${index + 1}`} value={paragraph} onChange={(value) => updateField("aboutParagraphs", content.aboutParagraphs.map((item, itemIndex) => itemIndex === index ? value : item))} multiline />)}
              </article>
              <article className="cms-panel"><div className="cms-card-heading"><h3>Learning features</h3><button className="cms-add" type="button" onClick={() => addItem("features")}>Add feature</button></div>
                {content.features.map((feature, index) => <div className="cms-list-row" key={`feature-${index}`}><TextField label="Title" value={feature.title} onChange={(value) => updateItem("features", index, "title", value)} /><TextField label="Description" value={feature.description} onChange={(value) => updateItem("features", index, "description", value)} multiline /><button className="cms-remove" type="button" onClick={() => removeItem("features", index)}>Remove</button></div>)}
              </article>
            </div>
          )}

          {activeSection === "programmes" && (
            <div className="cms-panel-grid">
              <article className="cms-panel"><div className="cms-card-heading"><h3>Programme cards</h3><button className="cms-add" type="button" onClick={() => addItem("programs")}>Add programme</button></div>
                {content.programs.map((program, index) => <div className="cms-list-row" key={`program-${index}`}><TextField label="Programme Title" value={program.title} onChange={(value) => updateItem("programs", index, "title", value)} /><TextField label="Category Badge (e.g. GRADES 9–12, NEET, IIT-JEE)" value={program.badge || ""} onChange={(value) => updateItem("programs", index, "badge", value)} /><TextField label="Icon / Symbol (e.g. 🎓, ✚, ⚛, 👥, ❓, ▶)" value={program.icon || ""} onChange={(value) => updateItem("programs", index, "icon", value)} /><TextField label="Description" value={program.description} onChange={(value) => updateItem("programs", index, "description", value)} multiline /><TextField label="Offer Badge (e.g. Free Demo Class Available)" value={program.offerBadge || ""} onChange={(value) => updateItem("programs", index, "offerBadge", value)} />{renderAssetUpload("programs", index, "imageUrl", "Upload Card Background / Illustration", program.imageUrl)}<ToggleField label="Show publicly" checked={program.enabled} onChange={(value) => updateItem("programs", index, "enabled", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("programs", index)}>Remove</button></div>)}
              </article>
              <article className="cms-panel"><div className="cms-card-heading"><h3>Plans and prices</h3><button className="cms-add" type="button" onClick={() => addItem("plans")}>Add plan</button></div>
                {content.plans.map((plan, index) => <div className="cms-list-row" key={`plan-${index}`}><TextField label="Plan name" value={plan.title} onChange={(value) => updateItem("plans", index, "title", value)} /><TextField label="Price" value={plan.price} onChange={(value) => updateItem("plans", index, "price", value)} /><TextField label="Description" value={plan.description} onChange={(value) => updateItem("plans", index, "description", value)} multiline /><ToggleField label="Show publicly" checked={plan.enabled} onChange={(value) => updateItem("plans", index, "enabled", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("plans", index)}>Remove</button></div>)}
              </article>
              <article className="cms-panel"><div className="cms-card-heading"><h3>Curriculum cards</h3><button className="cms-add" type="button" onClick={() => addItem("curricula")}>Add curriculum</button></div>
                {content.curricula.map((curriculum, index) => <div className="cms-list-row" key={`curriculum-${index}`}><TextField label="Board / curriculum" value={curriculum.title} onChange={(value) => updateItem("curricula", index, "title", value)} /><TextField label="Summary" value={curriculum.summary} onChange={(value) => updateItem("curricula", index, "summary", value)} multiline />{renderAssetUpload("curricula", index, "imageUrl", "Upload curriculum image", curriculum.imageUrl)}<TextField label="Image alt text" value={curriculum.altText} onChange={(value) => updateItem("curricula", index, "altText", value)} /><ToggleField label="Show publicly" checked={curriculum.enabled} onChange={(value) => updateItem("curricula", index, "enabled", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("curricula", index)}>Remove</button></div>)}
              </article>
            </div>
          )}

          {activeSection === "faculty" && (
            <div className="cms-panel-grid">
              <article className="cms-panel"><div className="cms-card-heading"><h3>Faculty profiles</h3><button className="cms-add" type="button" onClick={() => addItem("faculty")}>Add faculty</button></div>
                {content.faculty.map((person, index) => <div className="cms-list-row" key={`faculty-${index}`}><TextField label="Name" value={person.name} onChange={(value) => updateItem("faculty", index, "name", value)} /><TextField label="Subject" value={person.subject} onChange={(value) => updateItem("faculty", index, "subject", value)} /><TextField label="Qualification" value={person.qualification} onChange={(value) => updateItem("faculty", index, "qualification", value)} /><TextField label="Experience" value={person.experience} onChange={(value) => updateItem("faculty", index, "experience", value)} />{renderAssetUpload("faculty", index, "photoUrl", "Upload tutor photo", person.photoUrl)}<ToggleField label="Approved for public display" checked={person.approved} onChange={(value) => updateItem("faculty", index, "approved", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("faculty", index)}>Remove</button></div>)}
              </article>
              <article className="cms-panel"><div className="cms-card-heading"><h3>Testimonials</h3><button className="cms-add" type="button" onClick={() => addItem("testimonials")}>Add testimonial</button></div>
                {content.testimonials.map((testimonial, index) => <div className="cms-list-row" key={`testimonial-${index}`}><TextField label="Quote" value={testimonial.quote} onChange={(value) => updateItem("testimonials", index, "quote", value)} multiline /><TextField label="Name or approved initials" value={testimonial.name} onChange={(value) => updateItem("testimonials", index, "name", value)} /><TextField label="Learner class" value={testimonial.learnerClass} onChange={(value) => updateItem("testimonials", index, "learnerClass", value)} /><label className="cms-field"><span>Relationship</span><select value={testimonial.relation} onChange={(event) => updateItem("testimonials", index, "relation", event.target.value)}><option>Parent</option><option>Student</option></select></label><ToggleField label="Permission obtained / approved" checked={testimonial.approved} onChange={(value) => updateItem("testimonials", index, "approved", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("testimonials", index)}>Remove</button></div>)}
              </article>
            </div>
          )}

          {activeSection === "media" && (
            <article className="cms-panel"><div className="cms-card-heading"><div><h3>Demo videos</h3><p className="cms-hint">Videos appear publicly only when marked published. Student privacy consent is required.</p></div><button className="cms-add" type="button" onClick={() => addItem("demoVideos")}>Add video</button></div>
              {content.demoVideos.map((video, index) => <div className="cms-list-row" key={`video-${index}`}><TextField label="Title" value={video.title} onChange={(value) => updateItem("demoVideos", index, "title", value)} /><TextField label="Subject" value={video.subject} onChange={(value) => updateItem("demoVideos", index, "subject", value)} /><TextField label="Class" value={video.classLabel} onChange={(value) => updateItem("demoVideos", index, "classLabel", value)} />{renderAssetUpload("demoVideos", index, "videoUrl", "Upload MP4 video", video.videoUrl)}{renderAssetUpload("demoVideos", index, "thumbnailUrl", "Upload thumbnail", video.thumbnailUrl)}<TextField label="Video alt / description" value={video.altText} onChange={(value) => updateItem("demoVideos", index, "altText", value)} /><ToggleField label="Published with required permissions" checked={video.published} onChange={(value) => updateItem("demoVideos", index, "published", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("demoVideos", index)}>Remove</button></div>)}
            </article>
          )}

          {activeSection === "faq" && (
            <article className="cms-panel"><div className="cms-card-heading"><h3>Frequently asked questions</h3><button className="cms-add" type="button" onClick={() => addItem("faqs")}>Add FAQ</button></div>
              {content.faqs.map((faq, index) => <div className="cms-list-row" key={`faq-${index}`}><TextField label="Question" value={faq.question} onChange={(value) => updateItem("faqs", index, "question", value)} /><TextField label="Answer" value={faq.answer} onChange={(value) => updateItem("faqs", index, "answer", value)} multiline /><ToggleField label="Published" checked={faq.published} onChange={(value) => updateItem("faqs", index, "published", value)} /><button className="cms-remove" type="button" onClick={() => removeItem("faqs", index)}>Remove</button></div>)}
            </article>
          )}
        </div>
      </section>
    </div>
  );
}