"use client";

import { useState } from "react";

const offerings = {
  Mathematics: {
    intro: "Build the idea first, then practise the methods and questions in your current programme.",
    chips: ["Class [to confirm]", "Board [to confirm]", "Maths topics"],
  },
  Reasoning: {
    intro: "Reasoning programmes and availability will be listed here after SmartNum confirms them.",
    chips: ["Programme [to confirm]", "Practice [to confirm]", "Level [to confirm]"],
  },
  STEM: {
    intro: "STEM offerings and learning formats are placeholders until SmartNum confirms its programme list.",
    chips: ["Subject [to confirm]", "Programme [to confirm]", "Format [to confirm]"],
  },
};

type OfferingTab = keyof typeof offerings;

export function CourseExplorer() {
  const [active, setActive] = useState<OfferingTab>("Mathematics");
  const selected = offerings[active];

  return (
    <div className="course-explorer">
      <div className="course-tabs" role="tablist" aria-label="Explore learning areas">
        {(Object.keys(offerings) as OfferingTab[]).map((tab) => (
          <button
            key={tab}
            id={`course-tab-${tab.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={active === tab}
            aria-controls="course-tab-panel"
            className={active === tab ? "course-tab is-active" : "course-tab"}
            onClick={() => setActive(tab)}
          >
            {tab === "Mathematics" ? "Mathematics" : tab === "Reasoning" ? "Reasoning" : "STEM · to confirm"}
          </button>
        ))}
      </div>
      <div id="course-tab-panel" role="tabpanel" aria-labelledby={`course-tab-${active.toLowerCase()}`} className="course-tab-panel">
        <div>
          <span className="section-kicker">Explore learning</span>
          <h3>{active === "Mathematics" ? "Start with what you are studying." : active === "Reasoning" ? "Practise how to think through a problem." : "Explore a STEM path · details to confirm."}</h3>
          <p>{selected.intro}</p>
        </div>
        <div className="course-chip-list">{selected.chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
        <a className="text-link" href="#book-demo">Explore courses <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  );
}