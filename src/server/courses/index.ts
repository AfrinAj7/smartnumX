export type CourseMode = "centre" | "online" | "both";
export type CourseCategory = "school" | "competitive";

export interface CourseData {
  slug: string;
  title: string;
  shortTitle: string;
  category: CourseCategory;
  badge: string;
  board: string;
  classLevel: string;
  mode: CourseMode;
  subjects: string[];
  heroTagline: string;
  intro: string;
  whoFor: string[];
  notFor: string[];
  learn: Array<{
    group: string;
    items: string[];
  }>;
  howItWorks: Array<{
    title: string;
    description: string;
  }>;
  weekPlan: {
    summary: string;
    schedule: Array<{
      days: string;
      time: string;
      focus: string;
    }>;
  };
  whySmartnum: string;
  batchInfo: {
    size: string;
    timing: string;
    startDate: string;
  };
  fee: {
    amount: string;
    installments: string;
  };
  faqs: Array<{
    q: string;
    a: string;
  }>;
  related: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  heroImage: string;
  status: "published" | "draft";
}

export const COURSES: CourseData[] = [
  {
    slug: "class-9-maths-science-tuition",
    title: "Class 9 Maths & Science Tuition in Indirapuram",
    shortTitle: "Class 9 Tuition (Maths & Science)",
    category: "school",
    badge: "CBSE & ICSE",
    board: "CBSE & ICSE",
    classLevel: "Class 9",
    mode: "centre",
    subjects: ["Mathematics", "Science"],
    heroTagline: "Class 9 is where the real foundation gets built. We help your child understand it now, so Class 10 doesn't feel like a mountain.",
    intro: "Comprehensive, concept-first coaching for Class 9 students in Indirapuram. Small batches ensure every student asks doubts openly, with regular testing and continuous progress reports for parents.",
    whoFor: [
      "Students starting Class 9 who want to establish solid academic rhythm from day one.",
      "Learners who feel Maths and Science have suddenly become more abstract and demanding than Class 8.",
      "Parents who want regular feedback and chapter-by-chapter progress reports instead of surprises on term cards.",
    ],
    notFor: [
      "Students seeking only last-minute cramming tips without committing to regular attendance and practice.",
    ],
    learn: [
      {
        group: "Mathematics Core Curriculum",
        items: [
          "Number systems, irrational numbers, and real number representation on number lines.",
          "Polynomials, factor theorem, algebraic identities, and zero-finding techniques.",
          "Coordinate geometry, Cartesian plane mastery, and linear equations in two variables.",
          "Euclidean geometry, lines, angles, congruent triangles, and quadrilateral proofs.",
          "Circles, surface areas, volumes, and statistics/probability from first principles.",
        ],
      },
      {
        group: "Science (Physics, Chemistry & Biology)",
        items: [
          "Laws of motion, velocity-time graph analysis, and force-acceleration numericals.",
          "Gravitation, universal law, mass vs weight, and work, energy & power concepts.",
          "Matter in our surroundings, pure substances, atoms, molecules, and chemical structure.",
          "The cell as the fundamental unit of life, plant/animal tissues, and living systems.",
        ],
      },
      {
        group: "Crucial Academic Skills",
        items: [
          "Writing clear mathematical steps so school examiners award full marks.",
          "Careful word-problem reading to extract knowns, unknowns, and appropriate formulas.",
          "Independent revision habits and systematic test error-log maintenance.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Small, Focused Batches",
        description: "Strictly limited batch sizes (12–15 students) ensure questions are asked and answered out loud with individual attention.",
      },
      {
        title: "Concept First, Practice Next",
        description: "We explain the underlying 'why' before memorizing formulas, followed by progressive worksheet drills.",
      },
      {
        title: "Regular Diagnostic Tests",
        description: "Frequent chapter evaluations pinpoint exactly what to fix next, rather than just delivering a score.",
      },
      {
        title: "1-on-1 Doubt Sessions",
        description: "Dedicated personal doubt slots with faculty when a concept or proof doesn't click during class.",
      },
      {
        title: "Parent Progress Reports",
        description: "Transparent attendance records and periodic mock test performance updates shared directly with parents.",
      },
    ],
    weekPlan: {
      summary: "3 Maths classes + 3 Science classes per week, with a dedicated weekend testing and doubt resolution slot.",
      schedule: [
        { days: "Mon, Wed, Fri", time: "4:30 PM – 5:45 PM", focus: "Class 9 Mathematics (Concept & Problem Solving)" },
        { days: "Tue, Thu, Sat", time: "4:30 PM – 5:45 PM", focus: "Class 9 Science (Physics, Chemistry & Biology)" },
        { days: "Saturday", time: "6:00 PM – 7:30 PM", focus: "Chapter Test & Diagnostic Error Review" },
        { days: "Sunday", time: "By Appointment", focus: "1-on-1 Personalized Doubt Clearing" },
      ],
    },
    whySmartnum: "Class 9 marks are the foundation for everything that follows. Our teachers keep the pace gentle enough to understand and steady enough to finish the syllabus comfortably. We don't make empty promises of ranks; we promise honest feedback and a teacher who knows your child by name.",
    batchInfo: {
      size: "Maximum 12–15 students per batch",
      timing: "Weekday Evenings (4:30 PM – 7:00 PM) & Weekend Batches",
      startDate: "Fresh and ongoing term batches available",
    },
    fee: {
      amount: "Competitive academic fees with term packages",
      installments: "Convenient monthly and quarterly instalment plans available",
    },
    faqs: [
      {
        q: "Do you cover both CBSE and ICSE syllabi?",
        a: "Yes. We teach dedicated CBSE and ICSE modules with board-specific textbooks and practice materials. Tell us your board at the free demo so we place your child in the right batch.",
      },
      {
        q: "Is this course only for struggling students?",
        a: "Not at all. Many students join to stay ahead of their school schedule, while others join to fill learning gaps. Our small batch structure allows both to feel comfortable and challenged.",
      },
      {
        q: "How do parents know if their child is actually improving?",
        a: "Through regular chapter tests, homework check logs, and a tailor-made progress report card shared with parents every month.",
      },
      {
        q: "Can a student enrol in the middle of the academic year?",
        a: "Yes. We conduct a free 1-on-1 diagnostic assessment first to identify existing gaps and schedule bridge sessions to help catch up.",
      },
      {
        q: "What happens if my child misses a class due to illness or school events?",
        a: "All recorded lessons, class notes, and worksheets are accessible on our student portal, followed by a 1-on-1 doubt clearing slot.",
      },
    ],
    related: [
      "class-10-board-excellence",
      "maths-science-olympiads",
      "self-paced-recorded-modules",
    ],
    seo: {
      title: "Class 9 Maths & Science Tuition in Indirapuram | SmartNum",
      description: "Class 9 Maths and Science tuition for CBSE and ICSE in Indirapuram. Small batches, regular tests, doubt sessions. Book a free demo class.",
      keywords: ["class 9 maths and science tuition Indirapuram", "class 9 tuition Ghaziabad", "CBSE class 9 coaching", "ICSE class 9 maths tuition"],
      ogImage: "/images/Confident Mathematics Teacher Portrait.png",
    },
    heroImage: "/images/Confident Mathematics Teacher Portrait.png",
    status: "published",
  },
  {
    slug: "class-10-board-excellence",
    title: "Class 10 Board Coaching in Indirapuram",
    shortTitle: "Class 10 Board Excellence",
    category: "school",
    badge: "Board Prep",
    board: "CBSE & ICSE",
    classLevel: "Class 10",
    mode: "centre",
    subjects: ["Mathematics", "Science"],
    heroTagline: "Your first big board exam doesn't have to feel scary. We plan the year so there are no last-minute surprises.",
    intro: "Structured board examination coaching for Class 10 Maths and Science in Indirapuram. Early syllabus completion leaves ample room for rigorous sample papers, pre-board mocks, and step-marking refinement.",
    whoFor: [
      "Class 10 students aiming for 90%+ in Board exams who want a predictable, organized roadmap.",
      "Students needing to rebuild confidence and clarity in Maths formulas or Science diagrams.",
      "Parents looking for disciplined test schedules and regular pre-board performance tracking.",
    ],
    notFor: [
      "Students looking for superficial guessing shortcuts rather than conceptual mastery.",
    ],
    learn: [
      {
        group: "Class 10 Mathematics for Board Excellence",
        items: [
          "Real numbers, fundamental theorem of arithmetic, and polynomial roots.",
          "Linear equations, quadratic equations, and arithmetic progressions (AP).",
          "Triangles, coordinate geometry, and trigonometric ratios & identities.",
          "Applications of trigonometry (heights and distances) with clear diagram modeling.",
          "Circles, tangents, surface areas & volumes, and statistics/probability.",
        ],
      },
      {
        group: "Science (Physics, Chemistry & Biology)",
        items: [
          "Chemical reactions, acids/bases/salts, metals & non-metals, and carbon compounds.",
          "Life processes (nutrition, respiration, transportation, excretion), control & coordination, reproduction, and heredity.",
          "Light reflection & refraction (ray diagrams), human eye, electricity, and magnetic effects of electric current.",
        ],
      },
      {
        group: "Board Examination Strategy",
        items: [
          "Step-wise presentation technique that guarantees full credit from board examiners.",
          "Pacing and time-budgeting for 3-hour theoretical board question papers.",
          "Analyzing previous 10 years question papers (PYQs) and common examiner trap points.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Early Syllabus Completion",
        description: "We finish the complete board curriculum early (by November), giving students 3+ months of structured revision.",
      },
      {
        title: "Full 3-Hour Mock Boards",
        description: "Multiple timed mock board tests replicating actual board conditions, evaluated strictly with constructive feedback.",
      },
      {
        title: "One-to-One Doubt Support",
        description: "Personal doubt sessions scheduled before school pre-boards and final board exams.",
      },
      {
        title: "Step-Marking Clinic",
        description: "We train students exactly where marks get lost: missing units, skipped reasons in geometry, and incomplete calculations.",
      },
      {
        title: "Parent Progress Reviews",
        description: "Detailed pre-board assessment analysis shared with parents to plan final sprint strategies.",
      },
    ],
    weekPlan: {
      summary: "3 Maths sessions + 3 Science sessions per week, with weekend 3-hour board-format test drills.",
      schedule: [
        { days: "Mon, Wed, Fri", time: "5:30 PM – 7:00 PM", focus: "Class 10 Board Maths (Theory & PYQ Drills)" },
        { days: "Tue, Thu, Sat", time: "5:30 PM – 7:00 PM", focus: "Class 10 Board Science (Diagrams & Numericals)" },
        { days: "Saturday", time: "2:00 PM – 5:00 PM", focus: "Full-Length 3-Hour Mock Board Examination" },
        { days: "Sunday", time: "11:00 AM – 1:00 PM", focus: "One-to-One Error Correction & Doubt Clinic" },
      ],
    },
    whySmartnum: "Board marks come from steady practice and clear understanding, not tricks. We show students where they lose marks (careless errors, weak concepts, or timing) and fix that specific thing. We can't promise a score; we can promise attention.",
    batchInfo: {
      size: "Maximum 12–15 students per batch",
      timing: "Evening batches (4:00 PM – 7:30 PM)",
      startDate: "New batches starting every term; intensive board revision rounds from September",
    },
    fee: {
      amount: "Comprehensive annual / term package with study modules",
      installments: "Quarterly and monthly instalment options available",
    },
    faqs: [
      {
        q: "Which boards do you prepare for in Class 10?",
        a: "We prepare students for CBSE and ICSE boards, using NCERT, Exemplar, RD Sharma, and ICSE Selina materials with past 10-year board question banks.",
      },
      {
        q: "Do you conduct full-length mock board exams?",
        a: "Yes. Every student writes at least 5 to 7 full-length 3-hour mock board papers with strict step-marking evaluation before their final pre-boards.",
      },
      {
        q: "Can my child get extra 1-on-1 help before pre-boards?",
        a: "Yes, dedicated 1-on-1 doubt sessions are built into the programme especially during the December to February pre-board and revision period.",
      },
      {
        q: "Will you cover school homework and internal assessments?",
        a: "We focus on deep concept understanding and board exam excellence; our faculty also happily guides students on school assignments and practical queries.",
      },
      {
        q: "How early should we start Class 10 preparation?",
        a: "Starting at the beginning of the academic session is ideal. For mid-session joiners, we conduct a diagnostic test and formulate an accelerated catch-up plan.",
      },
    ],
    related: [
      "class-9-maths-science-tuition",
      "class-11-foundation-and-boards",
      "iit-jee-mains-preparation",
    ],
    seo: {
      title: "Class 10 Board Coaching in Indirapuram | SmartNum",
      description: "Class 10 board exam coaching for Maths and Science in Indirapuram. Small batches, mock tests, one-to-one doubt sessions. Book a free demo.",
      keywords: ["class 10 board coaching Indirapuram", "class 10 maths tuition Ghaziabad", "class 10 CBSE tuition Indirapuram", "board coaching Indirapuram"],
      ogImage: "/images/why-smartnum-tutor.jpg",
    },
    heroImage: "/images/why-smartnum-tutor.jpg",
    status: "published",
  },
  {
    slug: "class-11-foundation-and-boards",
    title: "Class 11 Foundation & Board Coaching in Indirapuram",
    shortTitle: "Class 11 Foundation & Boards",
    category: "school",
    badge: "Any Board",
    board: "CBSE, ICSE & Any Board",
    classLevel: "Class 11",
    mode: "centre",
    subjects: ["Mathematics", "Physics", "Chemistry"],
    heroTagline: "Class 11 is a big jump. We help you land it, whether your goal is a strong board result, JEE, or just keeping your options open.",
    intro: "Bridge the gap between Class 10 and Class 11 with Ph.D.-led mathematics and science coaching in Indirapuram. Build an unshakable conceptual base that powers both school exams and competitive entrance success.",
    whoFor: [
      "Students moving from Class 10 who feel the sudden jump in volume and conceptual difficulty.",
      "Families seeking a strong academic base that keeps both high school board marks and future JEE/competitive entrance options open.",
      "Learners who want to move beyond rote formula memorization toward true mathematical and scientific reasoning.",
    ],
    notFor: [
      "Students hoping to cruise by on Class 10 cramming habits without daily practice.",
    ],
    learn: [
      {
        group: "Higher Mathematics from First Principles",
        items: [
          "Sets, relations, functions, and graphical transformations.",
          "Trigonometric functions, sum-difference formulas, and trigonometric equations.",
          "Complex numbers, quadratic equations, and linear inequalities on coordinate axes.",
          "Permutations & combinations, and the binomial theorem with general term derivations.",
          "Sequences and series (AP, GP, special series summation).",
          "Straight lines, conic sections (parabola, ellipse, hyperbola), and 3D geometry basics.",
          "Limits, continuity, and first-principles introduction to differential calculus.",
          "Statistics, dispersion measures, and axiomatic probability.",
        ],
      },
      {
        group: "Physics & Chemistry Foundation",
        items: [
          "Kinematics in 1D & 2D, laws of motion, work-energy theorem, and rotational dynamics.",
          "Thermodynamics, kinetic theory of gases, and mechanical properties of solids/fluids.",
          "Atomic structure, periodic classification, chemical bonding, and molecular structure.",
          "Basic principles of organic chemistry and reaction mechanisms.",
        ],
      },
      {
        group: "Analytical Thinking & Problem Breakdown",
        items: [
          "Translating complex multi-line word problems into mathematical equations.",
          "Eliminating fear of abstract proofs through visualization and step-by-step logic.",
          "Organized notebook and error-tracking methods required for high school success.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Unified Curriculum",
        description: "One cohesive programme supporting school boards and foundational JEE thinking, so students never have to study twice.",
      },
      {
        title: "Ph.D.-Led Mathematics",
        description: "Experienced educators who explain abstract ideas intuitively before applying formulas.",
      },
      {
        title: "Weekly Diagnostic Tests",
        description: "Regular evaluations assessing board answer-writing and objective problem speed.",
      },
      {
        title: "Personal Doubt Support",
        description: "Dedicated one-to-one doubt clearing so unresolved questions don't snowball into exam anxiety.",
      },
      {
        title: "Recorded Lecture Library",
        description: "Students can rewatch any recorded topic anytime for revision or catch-up.",
      },
    ],
    weekPlan: {
      summary: "3–4 core sessions per week with weekend testing and individual problem-solving reviews.",
      schedule: [
        { days: "Mon, Wed, Fri", time: "5:00 PM – 6:30 PM", focus: "Class 11 Mathematics (Theory & Deep Derivations)" },
        { days: "Tue, Thu, Sat", time: "5:00 PM – 6:30 PM", focus: "Class 11 Physics & Chemistry Foundations" },
        { days: "Saturday", time: "6:45 PM – 8:15 PM", focus: "Weekly Assessment (Board + Foundation Level)" },
        { days: "Sunday", time: "10:00 AM – 12:00 PM", focus: "1-on-1 Doubt Sessions & Error Log Review" },
      ],
    },
    whySmartnum: "Many students lose confidence in Class 11 because early gaps pile up silently. Our free diagnostic session finds the exact gaps, and we start there instead of pretending they don't exist. With Ph.D.-level mathematics leadership, we turn abstract topics into clear, visual intuition.",
    batchInfo: {
      size: "Maximum 12–15 students per batch",
      timing: "Evening batches (5:00 PM – 8:00 PM)",
      startDate: "Fresh batches launch following Class 10 results; mid-session admissions after diagnostic check",
    },
    fee: {
      amount: "Structured academic tuition with all notes & test series included",
      installments: "Quarterly and monthly fee payment plans available",
    },
    faqs: [
      {
        q: "Do you teach students from all boards in Class 11?",
        a: "Yes. Our curriculum covers CBSE, ISC, and State Boards thoroughly, with board-specific step-writing guidance.",
      },
      {
        q: "Is this a dedicated JEE coaching batch?",
        a: "This course builds an exceptional dual foundation for school boards and JEE. For students seeking a dedicated 100% JEE track, see our IIT-JEE Mains Preparation programme.",
      },
      {
        q: "Can a student switch to the dedicated JEE batch later?",
        a: "Yes. As conceptual confidence strengthens, students can seamlessly transition into our intensive JEE preparation batches.",
      },
      {
        q: "What if my child's Class 10 maths foundation was average?",
        a: "That is precisely why we start with a diagnostic session. We identify and bridge specific prerequisite gaps before advancing into higher topics.",
      },
      {
        q: "Which subjects are covered?",
        a: "Higher Mathematics is our core specialisation, complemented by structured Physics and Chemistry foundational modules.",
      },
    ],
    related: [
      "class-10-board-excellence",
      "class-12-board-mastery",
      "iit-jee-mains-preparation",
    ],
    seo: {
      title: "Class 11 Maths Coaching in Indirapuram | SmartNum",
      description: "Class 11 Maths and Science coaching for any board in Indirapuram. Build a strong base for Boards and JEE. Small batches. Free demo class.",
      keywords: ["class 11 maths coaching Indirapuram", "class 11 tuition Ghaziabad", "class 11 CBSE coaching", "class 11 JEE foundation Indirapuram"],
      ogImage: "/images/Students in a Bright EdTech Wave Background.png",
    },
    heroImage: "/images/Students in a Bright EdTech Wave Background.png",
    status: "published",
  },
  {
    slug: "class-12-board-mastery",
    title: "Class 12 Board Mastery in Indirapuram",
    shortTitle: "Class 12 Board Mastery",
    category: "school",
    badge: "Board + Prep",
    board: "CBSE & Any Board",
    classLevel: "Class 12",
    mode: "centre",
    subjects: ["Mathematics", "Physics", "Chemistry"],
    heroTagline: "One year, two goals: a confident board result and a strong shot at your entrance exams. We plan both together.",
    intro: "Focused Class 12 board coaching in Indirapuram that balances subjective board exam precision with entrance exam problem-solving. Small batches, regular mock board papers, and continuous mentoring keep your crucial year calm and organized.",
    whoFor: [
      "Class 12 students juggling school pre-boards with JEE Mains, CUET, or regional entrance preparations.",
      "Students needing to secure 95%+ in Board Mathematics through disciplined step-writing and error elimination.",
      "Parents seeking a structured, transparent academic schedule for the most important school year.",
    ],
    notFor: [
      "Students looking to leave syllabus revision for the final four weeks before boards.",
    ],
    learn: [
      {
        group: "Higher Mathematics Mastery (Calculus & Vectors)",
        items: [
          "Relations, functions, and inverse trigonometric functions.",
          "Matrices and determinants with application to systems of linear equations.",
          "Continuity, differentiability, and applications of derivatives (tangents, normals, maxima/minima).",
          "Definite and indefinite integrals, properties, and area under curves.",
          "Differential equations, degree/order, and variable separable methods.",
          "Vector algebra, 3D geometry (direction cosines, lines, planes), linear programming, and conditional probability.",
        ],
      },
      {
        group: "Physics & Chemistry Core Board Syllabus",
        items: [
          "Electrostatics, current electricity, magnetic effects, electromagnetic induction, and AC circuits.",
          "Optics (ray & wave), dual nature of radiation, atoms, and semiconductor electronics.",
          "Solutions, electrochemistry, chemical kinetics, d- and f-block elements, coordination compounds, and organic reaction mechanisms.",
        ],
      },
      {
        group: "High-Performance Exam Strategy",
        items: [
          "Balancing subjective board step-marking with high-speed entrance testing.",
          "Time management strategies across 3-hour theoretical board question papers.",
          "Rigorous mock paper review eliminating recurring calculation mistakes.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Three-Phase Year Plan",
        description: "Phase 1: Concept Mastery (Apr–Sep); Phase 2: Board Drills & Mocks (Oct–Dec); Phase 3: Sample Paper Sprint (Jan–Feb).",
      },
      {
        title: "Strict Step-Marking Clinics",
        description: "We evaluate practice papers line-by-line to ensure students write the exact reasons that board evaluators require.",
      },
      {
        title: "Dual Focus Prep",
        description: "Every topic is covered for board subjective presentation first, followed by speed shortcuts for entrance tests.",
      },
      {
        title: "1-on-1 Pre-Board Doubt Sessions",
        description: "Personalised mentoring slots to resolve student-specific doubts before critical school exams.",
      },
      {
        title: "Parent Progress Briefings",
        description: "Regular updates keeping parents informed of mock test trajectories and preparedness milestones.",
      },
    ],
    weekPlan: {
      summary: "3–4 sessions per week with Sunday mock board exams and individualized error debriefs.",
      schedule: [
        { days: "Mon, Wed, Fri", time: "6:00 PM – 7:30 PM", focus: "Class 12 Mathematics (Calculus, Vectors & Probability)" },
        { days: "Tue, Thu, Sat", time: "6:00 PM – 7:30 PM", focus: "Class 12 Physics & Chemistry Core Topics" },
        { days: "Sunday", time: "10:00 AM – 1:00 PM", focus: "Full-Length 3-Hour Board Mock Examination" },
        { days: "Sunday", time: "1:30 PM – 3:00 PM", focus: "Step-Marking Review & Individual Doubt Clinic" },
      ],
    },
    whySmartnum: "Class 12 is stressful enough. Our job is to make the plan clear and the workload realistic. We tell you honestly where you stand every few weeks, and work relentlessly on the specific steps where you lose marks. Guided by Dr. Sweta Agrawal and expert mentors, we make mathematics clear and dependable.",
    batchInfo: {
      size: "Maximum 12–15 students per batch",
      timing: "Afternoon & Evening batches (4:30 PM – 8:00 PM)",
      startDate: "Early batches begin in April; crash revision cohorts start September",
    },
    fee: {
      amount: "Annual tuition package with complete test series and notes",
      installments: "Quarterly and monthly fee payment plans available",
    },
    faqs: [
      {
        q: "Do you prepare students for boards and entrance exams together?",
        a: "Yes. We ensure board marks are fully protected with rigorous step-writing practice, while building speed and accuracy required for competitive entrance exams.",
      },
      {
        q: "Which entrance exams do you support in this programme?",
        a: "JEE Mains, CUET, and regional engineering entrance examinations.",
      },
      {
        q: "Do you conduct full-length mock board exams?",
        a: "Yes. Every student writes at least 5 to 7 full 3-hour mock board tests under actual exam conditions with detailed step-wise grading.",
      },
      {
        q: "Can a student join mid-session?",
        a: "Yes. We evaluate current progress via a diagnostic test and prepare an accelerated revision plan to align with the cohort.",
      },
      {
        q: "Are recorded lectures available for revision?",
        a: "Yes, all lectures are recorded and accessible through our student portal so students can revisit tough derivations anytime.",
      },
    ],
    related: [
      "class-11-foundation-and-boards",
      "iit-jee-mains-preparation",
      "self-paced-recorded-modules",
    ],
    seo: {
      title: "Class 12 Board Coaching in Indirapuram | SmartNum",
      description: "Class 12 board coaching for Maths and Science in Indirapuram, with entrance exam preparation support. Small batches, mock tests. Free demo.",
      keywords: ["class 12 board coaching Indirapuram", "class 12 maths tuition Ghaziabad", "class 12 CBSE maths coaching", "board preparation Indirapuram"],
      ogImage: "/images/Confident Mathematics Teacher Portrait.png",
    },
    heroImage: "/images/Confident Mathematics Teacher Portrait.png",
    status: "published",
  },
  {
    slug: "iit-jee-mains-preparation",
    title: "IIT-JEE Mains Coaching in Indirapuram, Ghaziabad",
    shortTitle: "IIT-JEE Mains Preparation",
    category: "competitive",
    badge: "Popular",
    board: "JEE Mains + Boards",
    classLevel: "Classes 11–12",
    mode: "centre",
    subjects: ["Mathematics", "Physics", "Chemistry"],
    heroTagline: "Understand first, then practise at JEE level. We build the thinking, not just the speed.",
    intro: "Focused, small-batch IIT-JEE Mains coaching in Indirapuram, Ghaziabad. We prioritize deep concept clarity, strategic question selection, and detailed computer-based test analytics over massive crowded classrooms.",
    whoFor: [
      "Students who want a disciplined, high-yield JEE Mains preparation plan that fits alongside regular school.",
      "Learners who prefer small batches (max 15 students) where teachers know their individual strengths and weaknesses.",
      "Aspirants who want honest, objective diagnostic feedback rather than commercial rank hype.",
    ],
    notFor: [
      "Students unwilling to commit to regular homework sets and disciplined post-test mistake analysis.",
    ],
    learn: [
      {
        group: "JEE Mathematics Syllabus Mastery",
        items: [
          "Algebra: Complex numbers, quadratic equations, matrices, determinants, sequences & series, permutations, combinations, binomial theorem, and probability.",
          "Calculus: Limits, continuity, differentiability, applications of derivatives, definite/indefinite integrals, differential equations.",
          "Coordinate Geometry & Vectors: Straight lines, circles, parabolas, ellipses, hyperbolas, vector algebra, and 3D geometry.",
          "Trigonometry: Compound angles, trigonometric equations, and inverse functions.",
        ],
      },
      {
        group: "Physics & Chemistry for JEE Mains",
        items: [
          "Mechanics, thermal physics, electrodynamics, optics, and modern physics.",
          "Physical chemistry numericals, inorganic periodic trends, and organic reaction mechanisms.",
        ],
      },
      {
        group: "JEE Exam Craft & Strategy",
        items: [
          "Strategic question selection: identifying high-yield 4-markers and avoiding negative-marking traps.",
          "Speed vs accuracy optimization across computer-based test simulations.",
          "Maintaining an error log and turning every mistake into a permanent conceptual skill.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Tiered Problem Sets",
        description: "Every concept moves progressively through 3 levels: Concept Solidifier → JEE Mains Standard → Past 15 Years PYQs.",
      },
      {
        title: "NTA-Pattern Mock Tests",
        description: "Full-length mock tests simulating the exact NTA computer-based interface, with detailed post-test diagnostic metrics.",
      },
      {
        title: "1-on-1 Error Analysis",
        description: "Personal sessions with faculty analyzing exactly which questions were lost to careless calculation vs conceptual gaps.",
      },
      {
        title: "School Sync Timetable",
        description: "Lectures and tests are timed after school hours and on weekends so board exam preparation is never compromised.",
      },
      {
        title: "Recorded Lecture Vault",
        description: "High-definition recorded lectures available 24/7 for quick chapter revision before mock tests.",
      },
    ],
    weekPlan: {
      summary: "4 classes per week (2 hours each) with Sunday computer-based mock tests and error-correction clinics.",
      schedule: [
        { days: "Mon, Wed", time: "5:30 PM – 7:30 PM", focus: "JEE Mathematics (Advanced Problem Breakdown)" },
        { days: "Tue, Thu", time: "5:30 PM – 7:30 PM", focus: "JEE Physics & Chemistry (Numericals & PYQs)" },
        { days: "Saturday", time: "4:00 PM – 6:00 PM", focus: "Topic-wise Speed Drill & Doubt Clearing" },
        { days: "Sunday", time: "9:00 AM – 12:00 PM", focus: "Full-Length JEE Mains Computer-Based Mock Test" },
      ],
    },
    whySmartnum: "Most JEE preparation fails from gaps, not from lack of effort. We find the gap, repair it, then build speed. You'll hear straight answers about where you stand, with no inflated promises about ranks. With small batches and Ph.D.-led mentorship, your questions are addressed directly every single day.",
    batchInfo: {
      size: "Maximum 15 students per batch",
      timing: "Weekday Evenings & Weekend Batches",
      startDate: "Year-round cohorts for Class 11, Class 12, and revision tracks",
    },
    fee: {
      amount: "Transparent annual coaching fee with study materials and test series",
      installments: "Convenient installment options and merit diagnostic discounts",
    },
    faqs: [
      {
        q: "Can I prepare for JEE Mains comfortably alongside regular school?",
        a: "Yes. Our timetable (evenings and weekends) and structured homework load are designed specifically to support school-going students without burnout.",
      },
      {
        q: "Do you hold full-length computer-based mock tests?",
        a: "Yes. Students write regular full-length CBT mock tests replicating the exact NTA testing software, timing, and negative marking rules.",
      },
      {
        q: "How is SmartNum different from large commercial coaching institutes?",
        a: "Small batches (max 15 students vs 100+ in corporate batches), accessible teachers who know your child personally, and individual diagnostic error analysis after every test.",
      },
      {
        q: "Do you guarantee a rank in JEE?",
        a: "No. Nobody honestly can. What we guarantee is dedicated, expert teaching, small-batch attention, and rigorous preparation that maximizes your individual potential.",
      },
      {
        q: "How can I check if my child is ready for this programme?",
        a: "Book a free diagnostic assessment with our academic director. We will evaluate your child's conceptual baseline and provide an honest, actionable roadmap.",
      },
    ],
    related: [
      "iit-jee-advanced-mentorship",
      "class-11-foundation-and-boards",
      "class-12-board-mastery",
    ],
    seo: {
      title: "IIT-JEE Mains Coaching in Indirapuram, Ghaziabad | SmartNum",
      description: "IIT-JEE Mains preparation in Indirapuram, Ghaziabad. Concept-first teaching, mock tests with analysis, small batches. Book a free diagnostic session.",
      keywords: ["IIT JEE Mains coaching Indirapuram Ghaziabad", "JEE coaching Indirapuram", "best maths coaching for JEE Ghaziabad", "JEE mains tuition Indirapuram"],
      ogImage: "/images/why-smartnum-tutor.jpg",
    },
    heroImage: "/images/why-smartnum-tutor.jpg",
    status: "published",
  },
  {
    slug: "iit-jee-advanced-mentorship",
    title: "JEE Advanced Mentorship in Ghaziabad",
    shortTitle: "IIT-JEE Advanced Mentorship",
    category: "competitive",
    badge: "Intensive",
    board: "JEE Advanced",
    classLevel: "Classes 11–12 & Passouts",
    mode: "centre",
    subjects: ["Higher Mathematics", "Multi-Concept Physics", "Advanced Chemistry"],
    heroTagline: "For students who already know the basics and want to think like a JEE Advanced problem-setter.",
    intro: "Intensive, selective JEE Advanced mentorship in Ghaziabad. Led by Ph.D.-level mathematics faculty, this programme trains serious aspirants in multi-concept problem synthesis, proof-style reasoning, and calm decision-making under exam pressure.",
    whoFor: [
      "Aspirants comfortable with JEE Mains-level fundamentals who want to conquer multi-concept, high-difficulty problems.",
      "Students targeting top percentiles and seats in premier IITs.",
      "Learners who want personal mathematical mentorship rather than generic mass lectures.",
    ],
    notFor: [
      "Students still mastering basic formulas; we recommend starting with our Mains or Foundation programme first.",
    ],
    learn: [
      {
        group: "Advanced Mathematical Problem Synthesis",
        items: [
          "Complex numbers linked with coordinate geometry, loci, and polynomial roots.",
          "Non-routine calculus problems combining continuity, differentiability, and functional equations.",
          "Vector-geometry proofs, planes, tetrahedrons, and 3D spatial visualization.",
          "Advanced combinatorics, probability with recursion, and algebraic inequalities.",
        ],
      },
      {
        group: "Non-Standard Question Formats",
        items: [
          "Multiple-correct questions with partial-marking risk management.",
          "Matrix-match questions and paragraph comprehension problem-sets.",
          "Integer / numerical grid questions requiring zero computational errors.",
        ],
      },
      {
        group: "Cognitive Endurance & Exam Psychology",
        items: [
          "Navigating two consecutive 3-hour papers on JEE Advanced day without mental fatigue.",
          "Knowing when to abandon an unproductive question and move forward calmly.",
          "Developing an intuitive 'second method' to double-check complex solutions.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Intimate Mentorship Circles",
        description: "Small groups of 8 to 10 students engaging in discussion-led problem deconstruction with senior faculty.",
      },
      {
        title: "JEE Advanced Mock Batteries",
        description: "Full two-paper (Paper 1 & Paper 2) mock examinations followed by exhaustive step-by-step review.",
      },
      {
        title: "Direct Faculty Mentoring",
        description: "One-on-one sessions where faculty examine your exact thought process and demonstrate cleaner, more elegant solution paths.",
      },
      {
        title: "Error Log Transformation",
        description: "Systematic logging of every attempted problem to turn tricky traps into permanent problem-solving reflexes.",
      },
      {
        title: "Academic Honesty",
        description: "Regular, unvarnished progress feedback ensuring student and parents know precisely where preparation stands.",
      },
    ],
    weekPlan: {
      summary: "Weekend intensive masterclasses + weekday advanced problem sets and 1-on-1 discussions.",
      schedule: [
        { days: "Saturday", time: "2:00 PM – 5:00 PM", focus: "Advanced Problem Workshop (Multi-Concept Synthesis)" },
        { days: "Sunday", time: "9:00 AM – 12:00 PM", focus: "JEE Advanced Full Mock — Paper 1" },
        { days: "Sunday", time: "2:00 PM – 5:00 PM", focus: "JEE Advanced Full Mock — Paper 2" },
        { days: "Wednesday", time: "6:00 PM – 8:00 PM", focus: "1-on-1 Proof Review & Paper Analysis Clinic" },
      ],
    },
    whySmartnum: "Advanced preparation needs a mentor who will say 'this solution works, but here is a cleaner, faster way' and ask for a second approach. Led by Dr. Sweta Agrawal, Ph.D. in Mathematics, we teach you how to think like a problem-setter rather than just memorizing formulas.",
    batchInfo: {
      size: "Strictly limited to 8–10 students per group",
      timing: "Weekend Intensive & Evening Masterclasses",
      startDate: "Selective cohort admission following a readiness diagnostic test",
    },
    fee: {
      amount: "Specialized mentorship fee covering advanced material & test series",
      installments: "Flexible payment milestones available",
    },
    faqs: [
      {
        q: "How do I know if I am ready for the Advanced Mentorship batch?",
        a: "Take our free diagnostic assessment. We evaluate your core concept depth and give you an honest appraisal of whether this batch or the Mains batch fits best.",
      },
      {
        q: "Is this a replacement for the Mains programme?",
        a: "No. It builds directly upon strong Mains fundamentals to elevate problem-solving into multi-concept synthesis.",
      },
      {
        q: "How many students are in each mentoring group?",
        a: "Strictly 8 to 10 students. This guarantees deep discussion and individual review of each student's rough work and problem-solving steps.",
      },
      {
        q: "Do you promise an IIT seat?",
        a: "No. We promise serious, honest, Ph.D.-led mathematical mentorship that elevates your reasoning to the highest competitive standards.",
      },
    ],
    related: [
      "iit-jee-mains-preparation",
      "maths-science-olympiads",
      "class-12-board-mastery",
    ],
    seo: {
      title: "JEE Advanced Mentorship in Ghaziabad | SmartNum",
      description: "Intensive JEE Advanced mentorship in Ghaziabad: deep problem solving, personal guidance and honest feedback for serious aspirants. Free assessment.",
      keywords: ["JEE Advanced mentorship Ghaziabad", "IIT JEE advanced coaching Indirapuram", "advanced maths coaching Ghaziabad", "best JEE advanced tutor"],
      ogImage: "/images/Confident Mathematics Teacher Portrait.png",
    },
    heroImage: "/images/Confident Mathematics Teacher Portrait.png",
    status: "published",
  },
  {
    slug: "maths-science-olympiads",
    title: "Maths & Science Olympiad Coaching in Ghaziabad",
    shortTitle: "Math & Science Olympiads",
    category: "competitive",
    badge: "National",
    board: "Olympiads (IMO, NSO, RMO)",
    classLevel: "Classes 8–11",
    mode: "centre",
    subjects: ["Olympiad Mathematics", "Science Reasoning"],
    heroTagline: "For students who enjoy a puzzle more than a worksheet. We help you think harder, and enjoy it.",
    intro: "Inspiring Olympiad coaching in Indirapuram, Ghaziabad for curious, mathematically inclined students. Explore non-routine problem solving, number theory, combinatorics, and scientific inquiry without rote pressure.",
    whoFor: [
      "Curious students who love solving puzzles and non-routine mathematical and scientific problems.",
      "Parents who want their child to develop sharp logical reasoning and stretch well beyond standard school textbooks.",
      "Aspirants targeting national and international competitions like IMO, NSO, IOQM, and RMO.",
    ],
    notFor: [
      "Students seeking only school exam cramming; this course is about creative mathematical exploration and analytical depth.",
    ],
    learn: [
      {
        group: "Olympiad Mathematics",
        items: [
          "Number theory: divisibility, modular arithmetic, primes, Diophantine equations.",
          "Combinatorics: pigeonhole principle, inclusion-exclusion, permutations, graph theory basics.",
          "Euclidean geometry: cyclic quadrilaterals, power of a point, collinearity, concurrence.",
          "Algebra: polynomial roots, functional equations, and classic Cauchy-Schwarz & AM-GM inequalities.",
        ],
      },
      {
        group: "Science & Logical Reasoning",
        items: [
          "Experimental physics deduction, thought experiments, and dimensional analysis.",
          "Molecular reasoning, chemical stoichiometry, and biological systems logic.",
          "Critical deductive reasoning and algorithmic pattern recognition.",
        ],
      },
      {
        group: "The Problem Solver's Mindset",
        items: [
          "Finding multiple distinct solution methods for a single challenging problem.",
          "Writing rigorous, elegant mathematical proofs.",
          "Building intellectual stamina to work on a single problem over several days.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Puzzle-Club Atmosphere",
        description: "Classes feel like a lively mathematics club where students debate ideas and discover solutions together.",
      },
      {
        title: "Discussion-Led Teaching",
        description: "Instead of spoon-feeding solutions, teachers provide gentle hints that lead students to their own 'aha!' moment.",
      },
      {
        title: "Mock Olympiad Contests",
        description: "Regular contest-style tests under official time limits, followed by detailed solution discussions.",
      },
      {
        title: "1-on-1 Guidance",
        description: "Individual support when a student gets stuck on a challenging multi-step proof.",
      },
      {
        title: "Parent Insights",
        description: "Periodic feedback on the child's evolving problem-solving maturity and reasoning skills.",
      },
    ],
    weekPlan: {
      summary: "Weekend problem-solving sessions and collaborative discussion circles.",
      schedule: [
        { days: "Saturday", time: "3:00 PM – 5:00 PM", focus: "Olympiad Mathematics (Number Theory & Geometry)" },
        { days: "Sunday", time: "11:00 AM – 1:00 PM", focus: "Science Reasoning & Combinatorics Workshop" },
        { days: "Sunday", time: "2:00 PM – 3:30 PM", focus: "Contest Paper Drill & Solution Discussion" },
      ],
    },
    whySmartnum: "We keep the joy in it. A good olympiad class feels like a puzzle club with a patient, expert guide. We celebrate the 'aha!' moment more than a raw score, nurturing true intellectual confidence that lasts a lifetime.",
    batchInfo: {
      size: "Maximum 12 students per batch",
      timing: "Weekend Batches (Saturday & Sunday)",
      startDate: "Annual foundation batches and short-term contest prep sessions",
    },
    fee: {
      amount: "Accessible term fees with contest material and mock tests",
      installments: "Term and annual payment options available",
    },
    faqs: [
      {
        q: "Is this course too difficult for an average student?",
        a: "Any curious student who enjoys thinking can thrive here. We assess each student and place them in an appropriately tiered group so they feel excited rather than overwhelmed.",
      },
      {
        q: "Does olympiad coaching help with school exams?",
        a: "Immensely. When a student learns to solve non-routine olympiad problems, standard school syllabus questions feel straightforward, intuitive, and easy.",
      },
      {
        q: "Which specific olympiads do you prepare for?",
        a: "IMO (SOF), IOQM, RMO, NSO (National Science Olympiad), and national talent search scholarships.",
      },
      {
        q: "Do you register students for the olympiad exams?",
        a: "We notify families of official registration windows, share syllabus updates, and assist parents with the entry process.",
      },
    ],
    related: [
      "class-9-maths-science-tuition",
      "iit-jee-advanced-mentorship",
      "class-11-foundation-and-boards",
    ],
    seo: {
      title: "Maths & Science Olympiad Coaching in Ghaziabad | SmartNum",
      description: "Maths and Science Olympiad coaching in Ghaziabad: puzzles, deep problem solving and mock olympiads for curious students. Book a free demo.",
      keywords: ["maths olympiad coaching Ghaziabad", "science olympiad tuition Indirapuram", "IMO coaching Ghaziabad", "IOQM coaching Indirapuram"],
      ogImage: "/images/Students in a Bright EdTech Wave Background.png",
    },
    heroImage: "/images/Students in a Bright EdTech Wave Background.png",
    status: "published",
  },
  {
    slug: "self-paced-recorded-modules",
    title: "Self-Paced Recorded Maths & Science Modules",
    shortTitle: "Self-Paced Recorded Modules",
    category: "competitive",
    badge: "Online",
    board: "CBSE & Competitive Foundations",
    classLevel: "Classes 9–12",
    mode: "online",
    subjects: ["Mathematics", "Physics", "Chemistry"],
    heroTagline: "Learn at your own pace, from anywhere, and rewind as many times as you like.",
    intro: "High-definition recorded video lessons, chapter notes, and diagnostic tests from SmartNum. Study on your own schedule with the exact same conceptual clarity taught in our physical smart classrooms.",
    whoFor: [
      "Students who live outside Indirapuram or Ghaziabad and want access to SmartNum's Ph.D.-led teaching.",
      "Learners who want extra self-paced revision after school hours.",
      "Students who grasp concepts best when they can pause, rewatch, and control their learning speed.",
      "Existing classroom students seeking a 24/7 companion revision library.",
    ],
    notFor: [
      "Students who require in-person physical presence and supervision to remain motivated.",
    ],
    learn: [
      {
        group: "Complete Digital Video Library",
        items: [
          "Chapter-by-chapter concept breakdowns recorded on high-definition interactive smartboards.",
          "Every theorem, proof, and derivation explained step-by-step from first principles.",
          "Detailed worked solutions for standard board problems and competitive entrance questions.",
        ],
      },
      {
        group: "Curated Study Materials & Worksheets",
        items: [
          "Downloadable chapter summary notes and formula cheat-sheets.",
          "Graded homework worksheets with complete step-by-step answer keys.",
          "Diagnostic self-assessment quizzes after every module.",
        ],
      },
      {
        group: "Self-Directed Learning Habits",
        items: [
          "Setting personal study goals and tracking progress completion percentage.",
          "Effective note-taking methods while watching educational video lectures.",
          "Targeted review of difficult segments before school tests and exams.",
        ],
      },
    ],
    howItWorks: [
      {
        title: "Free Demo Lecture",
        description: "Watch a full sample video lecture on our platform before making any payment commitment.",
      },
      {
        title: "Instant Digital Access",
        description: "Pay securely online through Cashfree Payments and receive immediate access on your personal student dashboard.",
      },
      {
        title: "Pause, Rewind, Master",
        description: "Stream anytime on phone, tablet, or desktop with no limits on how many times you rewatch a lesson.",
      },
      {
        title: "Module Self-Tests",
        description: "Test your understanding after each chapter with instant score feedback and video walkthroughs.",
      },
      {
        title: "Digital Doubt Channel",
        description: "Submit conceptual questions through our digital doubt support channel for teacher feedback.",
      },
    ],
    weekPlan: {
      summary: "Flexible, self-directed study schedule tailored to your personal routine and school timetable.",
      schedule: [
        { days: "Flexible", time: "Self-Paced (24/7 Access)", focus: "Watch video lectures & take structured notes" },
        { days: "After Each Chapter", time: "45 Minutes", focus: "Solve module worksheet & submit online quiz" },
        { days: "Weekly", time: "As Needed", focus: "Submit doubt queries via student portal" },
      ],
    },
    whySmartnum: "The lessons are made by the very same teachers who teach in our Indirapuram smart classrooms. What you watch matches how we teach in person: calm, thorough, and rooted in conceptual clarity. We are honest about the format: recorded learning gives you unmatched schedule flexibility, backed by accessible digital doubt support.",
    batchInfo: {
      size: "Individual self-paced learning",
      timing: "On-demand 24/7 streaming access",
      startDate: "Immediate instant access upon enrolment",
    },
    fee: {
      amount: "Affordable chapter module pricing and all-inclusive annual passes",
      installments: "Instant online checkout via UPI, Cards, Netbanking (Cashfree)",
    },
    faqs: [
      {
        q: "Can I watch the recorded lessons on my mobile phone?",
        a: "Yes. Our student portal works smoothly on all mobile smartphones, tablets, iPads, laptops, and desktop computers.",
      },
      {
        q: "How long do I retain access to the course content?",
        a: "Enrolment includes full access for the entire academic session (12 months) with unlimited replays.",
      },
      {
        q: "How can I ask questions if I don't understand a step?",
        a: "You can post your question through our student doubt portal with a screenshot or timestamp, and our faculty will reply.",
      },
      {
        q: "Will I receive a certificate of completion?",
        a: "Yes! Students who complete 100% of the lessons and achieve the minimum attendance/viewing threshold receive a verified SmartNum Certificate of Completion.",
      },
      {
        q: "Can I combine this with physical classroom batches?",
        a: "Yes. Many of our Indirapuram classroom students use recorded modules as a powerful revision tool before exams.",
      },
    ],
    related: [
      "class-10-board-excellence",
      "class-12-board-mastery",
      "iit-jee-mains-preparation",
    ],
    seo: {
      title: "Online Maths & Science Recorded Course | SmartNum",
      description: "Learn Maths and Science online at your own pace with SmartNum's recorded modules, notes and tests. Start with a free sample lesson.",
      keywords: ["online maths recorded course", "self-paced maths tuition", "recorded science lectures", "online coaching for class 10 12"],
      ogImage: "/images/why-smartnum-tutor.jpg",
    },
    heroImage: "/images/why-smartnum-tutor.jpg",
    status: "published",
  },
];

export async function getAllCourses(): Promise<CourseData[]> {
  return COURSES;
}

export async function getAllCourseSlugs(): Promise<string[]> {
  return COURSES.map((course) => course.slug);
}

export async function getCourse(slug: string): Promise<CourseData | null> {
  const found = COURSES.find((c) => c.slug === slug);
  return found || null;
}
