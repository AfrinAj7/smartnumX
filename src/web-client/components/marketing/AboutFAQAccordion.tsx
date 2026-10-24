"use client";

import { useState } from "react";

export type AboutFAQItem = {
  question: string;
  answer: string;
};

export function AboutFAQAccordion({ items }: { items: AboutFAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="about-faq-accordion" role="region" aria-label="About SmartNum Frequently Asked Questions">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const btnId = `about-faq-btn-${index}`;
        const panelId = `about-faq-panel-${index}`;

        return (
          <div key={item.question} className={`about-faq-item ${isOpen ? "is-open" : ""}`}>
            <button
              id={btnId}
              type="button"
              className="about-faq-question-btn"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(index)}
            >
              <span className="faq-q-num">0{index + 1}</span>
              <span className="faq-q-text">{item.question}</span>
              <span className="faq-chevron" aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className="about-faq-answer"
              >
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
