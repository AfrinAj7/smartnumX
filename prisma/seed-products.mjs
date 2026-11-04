import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedProducts() {
  console.log("Starting SmartNum Course & Test Series seeding...");

  // 1. Ensure Physical Centre
  const centre = await prisma.centre.upsert({
    where: { id: "indirapuram-centre" },
    update: {
      name: "SmartNum Indirapuram Campus",
      city: "Indirapuram, Ghaziabad",
      address: "04224, ATS Advantage, Ahinsa Khand 1, Indirapuram, Ghaziabad, UP - 201014",
      phone: "+91 99589 47774",
      isActive: true,
    },
    create: {
      id: "indirapuram-centre",
      name: "SmartNum Indirapuram Campus",
      city: "Indirapuram, Ghaziabad",
      address: "04224, ATS Advantage, Ahinsa Khand 1, Indirapuram, Ghaziabad, UP - 201014",
      phone: "+91 99589 47774",
      isActive: true,
    },
  });
  console.log(`✓ Centre ready: ${centre.name}`);

  // 2. Seed Course Categories
  const courseCats = [
    { name: "Class 9th Coaching", slug: "class-9th-coaching", order: 1 },
    { name: "Class 10th Board Coaching", slug: "class-10th-board-coaching", order: 2 },
    { name: "Class 11th Foundation & Boards", slug: "class-11th-coaching", order: 3 },
    { name: "Class 12th Board Mastery", slug: "class-12th-board-coaching", order: 4 },
    { name: "IIT-JEE (Main) Courses", slug: "iit-jee-main-courses", order: 5 },
    { name: "IIT-JEE (Main + Advanced) Courses", slug: "iit-jee-main-advanced-courses", order: 6 },
  ];

  const createdCourseCats = {};
  for (const cat of courseCats) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, type: "COURSE", order: cat.order },
      create: { name: cat.name, slug: cat.slug, type: "COURSE", order: cat.order },
    });
    createdCourseCats[cat.slug] = c.id;
  }
  console.log("✓ Course categories ready");

  // 3. Seed Test Series Categories (Hierarchical)
  const testSeriesParents = [
    { name: "IIT JEE (Main + Advanced)", slug: "ts-iit-jee-main-advanced", order: 1 },
    { name: "IIT JEE Main", slug: "ts-iit-jee-main", order: 2 },
    { name: "Class 9–12", slug: "ts-class-9-12", order: 3 },
    { name: "Popular Exams", slug: "ts-popular-exams", order: 4 },
    { name: "Free Test Series", slug: "ts-free-test-series", order: 5 },
  ];

  const createdTsParents = {};
  for (const p of testSeriesParents) {
    const parent = await prisma.category.upsert({
      where: { slug: p.slug },
      update: { name: p.name, type: "TEST_SERIES", order: p.order, parentId: null },
      create: { name: p.name, slug: p.slug, type: "TEST_SERIES", order: p.order },
    });
    createdTsParents[p.slug] = parent.id;
  }

  // Subcategories
  const testSeriesSubcats = [
    // IIT JEE Main + Advanced subcategories
    { name: "Class 11th", slug: "ts-jee-adv-class-11", parentKey: "ts-iit-jee-main-advanced", order: 1 },
    { name: "Class 12th", slug: "ts-jee-adv-class-12", parentKey: "ts-iit-jee-main-advanced", order: 2 },
    { name: "Class 12th Plus (Droppers)", slug: "ts-jee-adv-droppers", parentKey: "ts-iit-jee-main-advanced", order: 3 },

    // IIT JEE Main subcategories
    { name: "Class 11th", slug: "ts-jee-main-class-11", parentKey: "ts-iit-jee-main", order: 1 },
    { name: "Class 12th", slug: "ts-jee-main-class-12", parentKey: "ts-iit-jee-main", order: 2 },
    { name: "Class 12th Plus", slug: "ts-jee-main-droppers", parentKey: "ts-iit-jee-main", order: 3 },

    // Class 9-12 subcategories
    { name: "Class 9", slug: "ts-school-class-9", parentKey: "ts-class-9-12", order: 1 },
    { name: "Class 10 (Board)", slug: "ts-school-class-10", parentKey: "ts-class-9-12", order: 2 },
    { name: "Class 11", slug: "ts-school-class-11", parentKey: "ts-class-9-12", order: 3 },
    { name: "Class 12 (Board)", slug: "ts-school-class-12", parentKey: "ts-class-9-12", order: 4 },
  ];

  const createdTsSubcats = {};
  for (const sub of testSeriesSubcats) {
    const parentId = createdTsParents[sub.parentKey];
    const cat = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, type: "TEST_SERIES", parentId, order: sub.order },
      create: { name: sub.name, slug: sub.slug, type: "TEST_SERIES", parentId, order: sub.order },
    });
    createdTsSubcats[sub.slug] = cat.id;
  }
  console.log("✓ Test series category hierarchy ready");

  // 4. Seed Courses
  const coursesData = [
    {
      title: "Class 9th Coaching (Maths & Science)",
      slug: "class-9-maths-science-tuition",
      description: "Concept-first coaching for Class 9 CBSE & ICSE. Solid foundation in Algebra, Euclidean Geometry, Physics mechanics, and Chemistry foundations with small 15-student batches.",
      categoryId: createdCourseCats["class-9th-coaching"],
      productType: "COURSE",
      mode: "BOTH",
      targetClass: "Class 9",
      targetExam: "CBSE & ICSE",
      badge: "CBSE & ICSE",
      inclusions: [
        "Live Classes & Interactive Discussions",
        "Full Recorded Lectures Archive",
        "Indirapuram Centre Lab & Doubts",
        "Daily Practice Problems (DPPs)",
        "Weekly Sunday Diagnostic Tests",
      ],
      validity: "Full Academic Year 2026-27",
      startDate: new Date("2026-04-15"),
      seatsTotal: 15,
      seatsLeft: 4,
      centreId: centre.id,
      price: "18000.00",
      discountPrice: "14499.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "Class 10th Board Excellence Coaching",
      slug: "class-10-board-excellence",
      description: "High-scoring Board Preparation for Class 10. Master NCERT Exemplar, 10-year Previous Year Questions (PYQs), and presentation techniques to score 95%+ in Maths & Science.",
      categoryId: createdCourseCats["class-10th-board-coaching"],
      productType: "COURSE",
      mode: "BOTH",
      targetClass: "Class 10",
      targetExam: "CBSE & ICSE",
      badge: "Board Prep",
      inclusions: [
        "Complete NCERT + Exemplar Line-by-Line",
        "10-Year Board PYQ Worked Solutions",
        "Pre-Board Simulation Exams with Evaluation",
        "Centre Classroom + Online Recording Access",
        "One-on-One Weak Area Feedback",
      ],
      validity: "Till Board Exams 2027",
      startDate: new Date("2026-04-10"),
      seatsTotal: 15,
      seatsLeft: 3,
      centreId: centre.id,
      price: "22000.00",
      discountPrice: "17999.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "Class 11th Foundation & Boards Coaching",
      slug: "class-11-foundation-and-boards",
      description: "Seamless bridge from Class 10 into higher secondary mathematics and science. Master Functions, Coordinate Geometry, Vectors, and Calculus fundamentals with personalized mentorship.",
      categoryId: createdCourseCats["class-11th-coaching"],
      productType: "COURSE",
      mode: "BOTH",
      targetClass: "Class 11",
      targetExam: "CBSE, ISC & Foundation",
      badge: "Foundation",
      inclusions: [
        "In-depth Concept Building from First Principles",
        "Advanced Calculus & Algebra Modules",
        "Fortnightly Performance & Attendance Reports",
        "Small Batch Mentoring at Indirapuram Campus",
        "Recorded Backup with Lifetime Replay",
      ],
      validity: "Full Academic Year 2026-27",
      startDate: new Date("2026-04-20"),
      seatsTotal: 15,
      seatsLeft: 6,
      centreId: centre.id,
      price: "28000.00",
      discountPrice: "22999.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "Class 12th Board Mastery Coaching",
      slug: "class-12-board-mastery",
      description: "Comprehensive mastery of Class 12 Boards with high-yield competitive orientation. Calculus, 3D Geometry, Linear Programming, and Electrostatics mastered with structured worksheets.",
      categoryId: createdCourseCats["class-12th-board-coaching"],
      productType: "COURSE",
      mode: "BOTH",
      targetClass: "Class 12",
      targetExam: "CBSE & ISC Boards",
      badge: "Board + Prep",
      inclusions: [
        "Full Class 12 Board Syllabus with Speed Drills",
        "Rigorous 5-Round Pre-Board Mock Drills",
        "CBSE Evaluation Rubric Answer Sheet Coaching",
        "Centre Classroom Seat + Hybrid Online Access",
        "Printed Revision Notes & Formula Booklets",
      ],
      validity: "Till Board Exams 2027",
      startDate: new Date("2026-04-05"),
      seatsTotal: 15,
      seatsLeft: 5,
      centreId: centre.id,
      price: "30000.00",
      discountPrice: "24999.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "IIT-JEE (Main) Intensive Coaching",
      slug: "iit-jee-mains-preparation",
      description: "Precision-driven preparation for JEE Main. Topic-wise speed techniques, elimination strategies, and intensive Computer-Based Test (CBT) drill designed for high percentile achievement.",
      categoryId: createdCourseCats["iit-jee-main-courses"],
      productType: "COURSE",
      mode: "BOTH",
      targetClass: "Class 11 & 12",
      targetExam: "IIT-JEE Main",
      badge: "Popular",
      inclusions: [
        "Chapter-wise High-Yield JEE Question Banks",
        "Computer-Based Mock Test Series with Percentile",
        "Time Management & Negative Marking Control Drills",
        "24/7 Digital Doubt Desk + Offline Centre Clinics",
        "Weekly Strategy Sessions with Mentors",
      ],
      validity: "Till JEE Main 2027 (Both Sessions)",
      startDate: new Date("2026-04-12"),
      seatsTotal: 15,
      seatsLeft: 2,
      centreId: centre.id,
      price: "42000.00",
      discountPrice: "34999.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "IIT-JEE (Main + Advanced) Mentorship",
      slug: "iit-jee-advanced-mentorship",
      description: "Premier mentorship for IIT-JEE Advanced aspirants. Multi-concept integration, non-routine challenging problems, and deep analytical reasoning coached by subject specialists.",
      categoryId: createdCourseCats["iit-jee-main-advanced-courses"],
      productType: "COURSE",
      mode: "BOTH",
      targetClass: "Class 11, 12 & Droppers",
      targetExam: "IIT-JEE (Main + Advanced)",
      badge: "Intensive",
      inclusions: [
        "Advanced Multi-Concept Problem Solving Sets",
        "National Benchmarking Mock Exams with Video Analysis",
        "One-on-One Weekly Academic Diagnostic Check-in",
        "Offline Masterclasses at Indirapuram Campus",
        "Archives of Past 20 Years JEE Advanced Solved",
      ],
      validity: "Till JEE Advanced 2027",
      startDate: new Date("2026-04-08"),
      seatsTotal: 15,
      seatsLeft: 3,
      centreId: centre.id,
      price: "55000.00",
      discountPrice: "44999.00",
      status: "PUBLISHED",
      featured: true,
    },
  ];

  for (const c of coursesData) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.description,
        categoryId: c.categoryId,
        productType: c.productType,
        mode: c.mode,
        targetClass: c.targetClass,
        targetExam: c.targetExam,
        badge: c.badge,
        inclusions: c.inclusions,
        validity: c.validity,
        startDate: c.startDate,
        seatsTotal: c.seatsTotal,
        seatsLeft: c.seatsLeft,
        centreId: c.centreId,
        price: c.price,
        discountPrice: c.discountPrice,
        status: c.status,
        featured: c.featured,
      },
      create: {
        ...c,
      },
    });
  }
  console.log("✓ Core Courses seeded");

  // 5. Seed Test Series Products
  const testSeriesData = [
    {
      title: "IIT-JEE Mains Full Mocks (High Yield)",
      slug: "iit-jee-mains-full-mocks",
      description: "20 full syllabus NTA-pattern mock tests with detailed performance analytics, step-by-step video solutions, all-India percentile benchmark, and topic-wise accuracy metrics.",
      categoryId: createdTsParents["ts-iit-jee-main"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Class 11th / 12th / Dropper",
      targetExam: "IIT-JEE Main",
      badge: "High Yield",
      inclusions: [
        "20 Full-Length Mocks on NTA CBT Interface",
        "40 Chapter & Sectional Topic Drills",
        "All-India Rank & Percentile Prediction",
        "Detailed Speed vs Accuracy Heatmap",
        "Complete Step-by-Step Solutions & Hints",
      ],
      features: [
        "Exact NTA Exam Simulation Interface",
        "Real-Time Percentile & Rank Predictor",
        "Weak Area & Time-Wastage Analysis",
        "Full Question Re-Attempt Mode",
      ],
      validity: "Till JEE Main 2027",
      testCountFull: 20,
      testCountChapter: 40,
      sampleTestUrl: "/sample-tests/jee-main-diagnostic",
      price: "1999.00",
      discountPrice: "999.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "IIT-JEE Advanced Full Mock Challenge",
      slug: "iit-jee-advanced-full-mock-challenge",
      description: "15 high-difficulty mock tests designed specifically for JEE Advanced. Includes single choice, multi-correct, integer/numerical, and comprehension matrix formats.",
      categoryId: createdTsParents["ts-iit-jee-main-advanced"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Class 12th & Droppers",
      targetExam: "IIT-JEE Advanced",
      badge: "Popular",
      inclusions: [
        "15 Dual-Paper Advanced Mock Simulations (Paper 1 & 2)",
        "30 Intensive Concept Integration Chapter Tests",
        "Subject-wise Accuracy & Negative Marking Breakdown",
        "Video Explanations for Tough Numerical Questions",
      ],
      features: [
        "Full Multi-Pattern Question Formats",
        "Negative Marks Elimination Strategy Tracker",
        "Topper Comparison Benchmark",
        "Downloadable Comprehensive PDF Reports",
      ],
      validity: "Till JEE Advanced 2027",
      testCountFull: 15,
      testCountChapter: 30,
      sampleTestUrl: "/sample-tests/jee-advanced-preview",
      price: "2499.00",
      discountPrice: "1499.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "Class 10 Board Mock Series",
      slug: "class-10-board-mock-series",
      description: "10 full-length Board simulation papers strictly adhering to the latest CBSE & ICSE syllabus. Includes official step-by-step marking scheme solutions.",
      categoryId: createdTsSubcats["ts-school-class-10"] || createdTsParents["ts-class-9-12"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Class 10",
      targetExam: "CBSE & ICSE Boards",
      badge: "New",
      inclusions: [
        "10 Standard & Basic Maths Full-Length Papers",
        "25 Chapter-wise Topic Revision Drills",
        "Step-by-step CBSE Rubric Scoring Solutions",
        "Common Errors & Pitfalls Warning Guide",
      ],
      features: [
        "Strict 3-Hour Board Timing Simulator",
        "Official CBSE Marking Scheme Keys",
        "Printable Question Papers & OMR Sheets",
        "Topic-wise Weakness Identification",
      ],
      validity: "Till Board Exams 2027",
      testCountFull: 10,
      testCountChapter: 25,
      sampleTestUrl: "/sample-tests/class-10-board-sample",
      price: "1299.00",
      discountPrice: "699.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "Class 12 Board Mock Papers (2026 Batch)",
      slug: "class-12-board-mock-papers",
      description: "12 high-scoring board practice tests for Class 12 mathematics and science with detailed marking schemes and model answer presentations.",
      categoryId: createdTsSubcats["ts-school-class-12"] || createdTsParents["ts-class-9-12"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Class 12",
      targetExam: "CBSE & ISC Boards",
      badge: "2026 Batch",
      inclusions: [
        "12 Full-Length 80-Mark Board Papers",
        "30 Calculus, Algebra & Vectors Sectional Mocks",
        "Handwritten Topper-Style Model Solution Scripts",
        "Formula Memorization Checklists",
      ],
      features: [
        "Timed 3-Hour Exam Environment",
        "Step-by-step Step-Marking Guidelines",
        "High-Weightage Chapter Question Focus",
        "Instant Evaluation & Percentile",
      ],
      validity: "Till Board Exams 2027",
      testCountFull: 12,
      testCountChapter: 30,
      sampleTestUrl: "/sample-tests/class-12-sample",
      price: "1499.00",
      discountPrice: "799.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "Class 9 Foundational Test Series",
      slug: "class-9-foundational-test-series",
      description: "Structured diagnostic and formative assessments for Class 9 students to identify conceptual gaps early and build examination confidence.",
      categoryId: createdTsSubcats["ts-school-class-9"] || createdTsParents["ts-class-9-12"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Class 9",
      targetExam: "School & Foundation",
      badge: "New",
      inclusions: [
        "8 Full Term-1 and Term-2 Mocks",
        "20 Concept Mastery Chapter Quizzes",
        "Instant Graphical Progress Reports",
        "Explanatory Solutions for Every Question",
      ],
      features: [
        "Self-Paced Chapter Quizzes",
        "Instant Explanations & Key Concept Takeaways",
        "Parent Performance Dashboard",
      ],
      validity: "1 Year Academic Access",
      testCountFull: 8,
      testCountChapter: 20,
      price: "999.00",
      discountPrice: "499.00",
      status: "PUBLISHED",
      featured: false,
    },
    {
      title: "Class 11 Concept & Board Mocks",
      slug: "class-11-concept-board-mocks",
      description: "10 Unit tests and full mocks covering the entire Class 11 curriculum with a strong focus on Calculus, Trigonometry, and coordinate geometry.",
      categoryId: createdTsSubcats["ts-school-class-11"] || createdTsParents["ts-class-9-12"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Class 11",
      targetExam: "CBSE & ISC Boards",
      badge: "Popular",
      inclusions: [
        "10 Full-Length Annual Examination Mocks",
        "25 Unit Tests on High-Impact Topics",
        "Complete Step-by-Step Problem Breakdowns",
      ],
      features: [
        "Timed Online Exam Engine",
        "Chapter-wise Performance Analytics",
        "Downloadable Solutions in PDF",
      ],
      validity: "1 Year Academic Access",
      testCountFull: 10,
      testCountChapter: 25,
      price: "1299.00",
      discountPrice: "699.00",
      status: "PUBLISHED",
      featured: false,
    },
    {
      title: "Annual Scholarship Assessment",
      slug: "annual-scholarship-assessment",
      description: "Take the SmartNum National Scholarship Assessment to test your mathematical reasoning, logic, and core concepts. Qualify for up to 50% tuition scholarship.",
      categoryId: createdTsParents["ts-popular-exams"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Classes 9–12 & JEE",
      targetExam: "Scholarship & Diagnostic",
      badge: "Up to 50% Off",
      isFree: true,
      inclusions: [
        "Comprehensive 60-Minute Assessment",
        "Scholarship Eligibility Score (Up to 50% Tuition Waiver)",
        "Detailed Academic Profile & Strengths Analysis",
        "One-on-One Counselling Session with Faculty",
      ],
      features: [
        "100% Free Registration & Instant Attempt",
        "Instant Scholarship Certificate Generation",
        "National Benchmarking Score",
      ],
      validity: "30 Days from Registration",
      testCountFull: 1,
      testCountChapter: 3,
      price: "499.00",
      discountPrice: "0.00",
      status: "PUBLISHED",
      featured: true,
    },
    {
      title: "Free Diagnostic Mock Test",
      slug: "free-diagnostic-mock-test",
      description: "A quick 30-minute diagnostic mock test that Pinpoints your exact weak areas across Algebra, Geometry, and Mechanics. Instant score and personalized improvement roadmap.",
      categoryId: createdTsParents["ts-free-test-series"],
      productType: "TEST_SERIES",
      mode: "ONLINE",
      targetClass: "Classes 9–12 & JEE",
      targetExam: "Diagnostic Mock",
      badge: "Free",
      isFree: true,
      inclusions: [
        "30-Minute Adaptive Diagnostic Test",
        "Instant Detailed Weak-Spot Breakdown Report",
        "Recommended Next Steps & Free Study Guide",
        "Zero Payment or Credit Card Required",
      ],
      features: [
        "Instant Automated Evaluation",
        "Question-by-Question Solution Analysis",
        "100% Free Lifetime Access",
      ],
      validity: "Lifetime Free Access",
      testCountFull: 1,
      testCountChapter: 2,
      price: "0.00",
      discountPrice: "0.00",
      status: "PUBLISHED",
      featured: true,
    },
  ];

  for (const ts of testSeriesData) {
    await prisma.course.upsert({
      where: { slug: ts.slug },
      update: {
        title: ts.title,
        description: ts.description,
        categoryId: ts.categoryId,
        productType: ts.productType,
        mode: ts.mode,
        targetClass: ts.targetClass,
        targetExam: ts.targetExam,
        badge: ts.badge,
        inclusions: ts.inclusions,
        features: ts.features,
        validity: ts.validity,
        testCountFull: ts.testCountFull,
        testCountChapter: ts.testCountChapter,
        sampleTestUrl: ts.sampleTestUrl,
        price: ts.price,
        discountPrice: ts.discountPrice,
        isFree: ts.isFree || false,
        status: ts.status,
        featured: ts.featured,
      },
      create: {
        ...ts,
      },
    });
  }
  console.log("✓ Test Series products seeded");

  // 6. Seed Coupons
  const sampleDate = new Date("2026-01-01T00:00:00.000Z");
  const expiryDate = new Date("2027-12-31T23:59:59.000Z");

  const coupons = [
    { code: "WELCOME10", type: "PERCENT", value: "10.00", minCart: "500.00" },
    { code: "FLAT500", type: "FLAT", value: "500.00", minCart: "2000.00" },
    { code: "SMARTMOCK", type: "FLAT", value: "300.00", minCart: "800.00" },
    { code: "SAMPLE10", type: "PERCENT", value: "10.00", minCart: "0.00" },
    { code: "SAMPLE250", type: "FLAT", value: "250.00", minCart: "0.00" },
  ];

  for (const cp of coupons) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: {
        type: cp.type,
        value: cp.value,
        minCart: cp.minCart,
        validFrom: sampleDate,
        validTo: expiryDate,
      },
      create: {
        code: cp.code,
        type: cp.type,
        value: cp.value,
        minCart: cp.minCart,
        validFrom: sampleDate,
        validTo: expiryDate,
        courseIds: [],
        applicableTypes: ["COURSE", "TEST_SERIES"],
      },
    });
  }
  console.log("✓ Promotional Coupons seeded");

  console.log("\n=========================================");
  console.log("🎉 ALL SEED DATA HAS BEEN SUCCESSFULLY POPULATED!");
  console.log("=========================================\n");
}

seedProducts()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
