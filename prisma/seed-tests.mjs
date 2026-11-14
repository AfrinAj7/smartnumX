import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTests() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping sample test seeding in production environment.");
    return;
  }

  console.log("Seeding sample CBT tests (status: DRAFT) for Phase 8...");

  // Find an admin user to be the creator
  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  const creatorId = admin ? admin.id : null;

  // Find linked test series courses
  const jeeSeries = await prisma.course.findUnique({
    where: { slug: "iit-jee-mains-full-mocks" },
  });
  const class11Series = await prisma.course.findUnique({
    where: { slug: "class-11-concept-board-mocks" },
  });
  const diagSeries = await prisma.course.findUnique({
    where: { slug: "free-diagnostic-mock-test" },
  });

  // ==========================================
  // 1. JEE MAIN FULL MOCK 1 (JEE-MOCK-01)
  // ==========================================
  const test1 = await prisma.test.upsert({
    where: { code: "JEE-MOCK-01" },
    update: {
      title: "JEE Main Full Mock 1 (Sample Demo)",
      description: "Comprehensive NTA-pattern mock test covering Physics, Chemistry, and Mathematics with Section A (MCQ) and Section B (Numerical).",
      type: "FULL_MOCK",
      status: "DRAFT",
      durationMin: 180,
      totalMarks: 40,
      passMarks: 16,
      lateStartRule: "REDUCE_TIME",
      graceSeconds: 15,
      maxAttempts: 1,
      requireFullscreen: false,
      maxViolations: 0,
      resultMode: "INSTANT",
      solutionMode: "AFTER_SUBMIT",
      isFreePreview: false,
      seriesId: jeeSeries?.id || null,
      instructions: "This test comprises 2 sections. Section A contains 6 Multiple Choice Questions with 4 marks for correct and -1 for incorrect. Section B contains 4 Numerical response questions with +4 for correct and 0 negative marking.",
    },
    create: {
      code: "JEE-MOCK-01",
      title: "JEE Main Full Mock 1 (Sample Demo)",
      description: "Comprehensive NTA-pattern mock test covering Physics, Chemistry, and Mathematics with Section A (MCQ) and Section B (Numerical).",
      type: "FULL_MOCK",
      status: "DRAFT",
      durationMin: 180,
      totalMarks: 40,
      passMarks: 16,
      lateStartRule: "REDUCE_TIME",
      graceSeconds: 15,
      maxAttempts: 1,
      requireFullscreen: false,
      maxViolations: 0,
      resultMode: "INSTANT",
      solutionMode: "AFTER_SUBMIT",
      isFreePreview: false,
      seriesId: jeeSeries?.id || null,
      instructions: "This test comprises 2 sections. Section A contains 6 Multiple Choice Questions with 4 marks for correct and -1 for incorrect. Section B contains 4 Numerical response questions with +4 for correct and 0 negative marking.",
    },
  });

  // Create Sections for JEE-MOCK-01
  let sec1A = await prisma.testSection.findFirst({
    where: { testId: test1.id, name: "Section A - Multiple Choice" },
  });
  if (!sec1A) {
    sec1A = await prisma.testSection.create({
      data: {
        testId: test1.id,
        name: "Section A - Multiple Choice",
        order: 1,
        durationMin: null,
      },
    });
  }

  let sec1B = await prisma.testSection.findFirst({
    where: { testId: test1.id, name: "Section B - Numerical Value" },
  });
  if (!sec1B) {
    sec1B = await prisma.testSection.create({
      data: {
        testId: test1.id,
        name: "Section B - Numerical Value",
        order: 2,
        durationMin: null,
        maxToAttempt: 2, // Choice rule: attempt any 2 of 4
      },
    });
  }

  // Sample Questions for JEE-MOCK-01
  const jeeQuestions = [
    {
      code: "JEE-PHY-001",
      type: "MCQ_SINGLE",
      subject: "Physics",
      chapter: "Kinematics",
      difficulty: "MEDIUM",
      stem: "A projectile is launched from ground level with speed $v_0 = 20\\text{ m/s}$ at an angle of $30^\\circ$ to the horizontal. Taking $g = 10\\text{ m/s}^2$, what is its maximum height above the ground?",
      options: [
        { id: "A", text: "$5\\text{ m}$" },
        { id: "B", text: "$10\\text{ m}$" },
        { id: "C", text: "$15\\text{ m}$" },
        { id: "D", text: "$20\\text{ m}$" },
      ],
      correct: { answer: "A" },
      explanation: "$H = \\frac{v_0^2 \\sin^2(30^\\circ)}{2g} = \\frac{400 \\times (0.5)^2}{20} = \\frac{100}{20} = 5\\text{ m}$.",
      sectionId: sec1A.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "JEE-PHY-002",
      type: "MCQ_SINGLE",
      subject: "Physics",
      chapter: "Work, Power & Energy",
      difficulty: "EASY",
      stem: "A body of mass $2\\text{ kg}$ is displaced from $(0,0)$ to $(3,4)\\text{ m}$ under a constant force $\\vec{F} = (4\\hat{i} + 3\\hat{j})\\text{ N}$. The work done by the force is:",
      options: [
        { id: "A", text: "$12\\text{ J}$" },
        { id: "B", text: "$24\\text{ J}$" },
        { id: "C", text: "$25\\text{ J}$" },
        { id: "D", text: "$7\\text{ J}$" },
      ],
      correct: { answer: "B" },
      explanation: "$W = \\vec{F} \\cdot \\vec{d} = (4)(3) + (3)(4) = 12 + 12 = 24\\text{ J}$.",
      sectionId: sec1A.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "JEE-MAT-001",
      type: "MCQ_SINGLE",
      subject: "Mathematics",
      chapter: "Matrices & Determinants",
      difficulty: "MEDIUM",
      stem: "If $A = \\begin{bmatrix} 2 & 3 \\\\ 1 & 2 \\end{bmatrix}$, then the value of $\\det(A^3 - 2A^2)$ is equal to:",
      options: [
        { id: "A", text: "$-1$" },
        { id: "B", text: "$0$" },
        { id: "C", text: "$1$" },
        { id: "D", text: "$-2$" },
      ],
      correct: { answer: "A" },
      explanation: "$\\det(A) = 4 - 3 = 1$. The characteristic equation is $\\det(A - \\lambda I) = 0 \\implies \\lambda^2 - 4\\lambda + 1 = 0$, so $A^2 - 4A + I = 0$. Factor $A^3 - 2A^2 = A^2(A - 2I)$. Evaluating determinant yields $-1$.",
      sectionId: sec1A.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "JEE-MAT-002",
      type: "MCQ_SINGLE",
      subject: "Mathematics",
      chapter: "Definite Integrals",
      difficulty: "HARD",
      stem: "Evaluate the integral: $I = \\int_{0}^{\\pi/2} \\frac{\\sin(x)}{\\sin(x) + \\cos(x)} \\, dx$.",
      options: [
        { id: "A", text: "$\\pi / 4$" },
        { id: "B", text: "$\\pi / 2$" },
        { id: "C", text: "$1$" },
        { id: "D", text: "$\\pi$" },
      ],
      correct: { answer: "A" },
      explanation: "Using the property $\\int_0^a f(x) dx = \\int_0^a f(a-x) dx$: $2I = \\int_0^{\\pi/2} 1 \\, dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$.",
      sectionId: sec1A.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "JEE-CHM-001",
      type: "MCQ_SINGLE",
      subject: "Chemistry",
      chapter: "Chemical Thermodynamics",
      difficulty: "EASY",
      stem: "For an isolated system, the change in internal energy $\\Delta U$ in any process is always:",
      options: [
        { id: "A", text: "Positive" },
        { id: "B", text: "Negative" },
        { id: "C", text: "Zero" },
        { id: "D", text: "Infinite" },
      ],
      correct: { answer: "C" },
      explanation: "An isolated system does not exchange heat or work with surroundings ($q = 0, w = 0$). By the first law, $\\Delta U = q + w = 0$.",
      sectionId: sec1A.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "JEE-CHM-002",
      type: "MCQ_SINGLE",
      subject: "Chemistry",
      chapter: "Atomic Structure",
      difficulty: "MEDIUM",
      stem: "The wavelength associated with a golf ball of mass $40\\text{ g}$ moving at a speed of $45\\text{ m/s}$ is of the order of ($h = 6.626 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$):",
      options: [
        { id: "A", text: "$3.7 \\times 10^{-34}\\text{ m}$" },
        { id: "B", text: "$3.7 \\times 10^{-30}\\text{ m}$" },
        { id: "C", text: "$6.6 \\times 10^{-34}\\text{ m}$" },
        { id: "D", text: "$1.2 \\times 10^{-32}\\text{ m}$" },
      ],
      correct: { answer: "A" },
      explanation: "$\\lambda = \\frac{h}{mv} = \\frac{6.626 \\times 10^{-34}}{0.040 \\times 45} = 3.68 \\times 10^{-34}\\text{ m}$.",
      sectionId: sec1A.id,
      marks: 4,
      negMarks: 1,
    },
    // Numerical Questions for Section B
    {
      code: "JEE-PHY-NUM-01",
      type: "NUMERIC",
      subject: "Physics",
      chapter: "Electrostatics",
      difficulty: "MEDIUM",
      stem: "Two identical conducting spheres carry charges $+2\\,\\mu\\text{C}$ and $-6\\,\\mu\\text{C}$ and are separated by a distance $r$. They are brought into contact and separated back to distance $r$. If the initial electrostatic force was $12\\text{ N}$, what is the magnitude of the new force (in $\\text{N}$)?",
      options: null,
      correct: { answer: 4, min: 3.9, max: 4.1 },
      explanation: "Initial force $F_1 \\propto |q_1 q_2| = (2)(6) = 12$. On contact, each gets $q' = (2 - 6)/2 = -2\\,\\mu\\text{C}$. New force $F_2 \\propto (-2)(-2) = 4$. Since $F_1 = 12\\text{ N}$, $F_2 = 4\\text{ N}$.",
      sectionId: sec1B.id,
      marks: 4,
      negMarks: 0,
    },
    {
      code: "JEE-MAT-NUM-01",
      type: "NUMERIC",
      subject: "Mathematics",
      chapter: "Polynomials",
      difficulty: "MEDIUM",
      stem: "If the roots of the equation $x^2 - px + 8 = 0$ differ by $2$, then the positive integer value of $p$ is:",
      options: null,
      correct: { answer: 6, min: 5.99, max: 6.01 },
      explanation: "Let roots be $\\alpha, \\beta$. $\\alpha + \\beta = p$, $\\alpha\\beta = 8$. $(\\alpha - \\beta)^2 = (\\alpha+\\beta)^2 - 4\\alpha\\beta \\implies 4 = p^2 - 32 \\implies p^2 = 36 \\implies p = 6$.",
      sectionId: sec1B.id,
      marks: 4,
      negMarks: 0,
    },
    {
      code: "JEE-CHM-NUM-01",
      type: "NUMERIC",
      subject: "Chemistry",
      chapter: "Solutions",
      difficulty: "EASY",
      stem: "The van 't Hoff factor $i$ for a complete dissociation of potassium sulfate ($K_2SO_4$) in dilute aqueous solution is:",
      options: null,
      correct: { answer: 3, min: 2.99, max: 3.01 },
      explanation: "$K_2SO_4 \\rightarrow 2K^+ + SO_4^{2-}$, producing $2 + 1 = 3$ ions per formula unit.",
      sectionId: sec1B.id,
      marks: 4,
      negMarks: 0,
    },
    {
      code: "JEE-MAT-NUM-02",
      type: "NUMERIC",
      subject: "Mathematics",
      chapter: "Probability",
      difficulty: "HARD",
      stem: "A pair of fair dice is rolled. If the sum of the numbers is $7$, the probability that at least one of the dice shows a $3$ is $\\frac{k}{6}$. What is the value of integer $k$?",
      options: null,
      correct: { answer: 2, min: 1.99, max: 2.01 },
      explanation: "Pairs with sum 7 are: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). Total 6 outcomes. Pairs with at least one 3 are (3,4) and (4,3), which is 2 outcomes. Probability = 2/6, so k = 2.",
      sectionId: sec1B.id,
      marks: 4,
      negMarks: 0,
    },
  ];

  let orderIndex = 1;
  for (const qData of jeeQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qData.code },
      update: {
        stem: qData.stem,
        options: qData.options,
        correct: qData.correct,
        explanation: qData.explanation,
        subject: qData.subject,
        chapter: qData.chapter,
        difficulty: qData.difficulty,
        type: qData.type,
        createdById: creatorId,
      },
      create: {
        code: qData.code,
        stem: qData.stem,
        options: qData.options,
        correct: qData.correct,
        explanation: qData.explanation,
        subject: qData.subject,
        chapter: qData.chapter,
        difficulty: qData.difficulty,
        type: qData.type,
        createdById: creatorId,
      },
    });

    await prisma.testQuestion.upsert({
      where: {
        testId_questionId: {
          testId: test1.id,
          questionId: q.id,
        },
      },
      update: {
        sectionId: qData.sectionId,
        order: orderIndex,
        marks: qData.marks,
        negMarks: qData.negMarks,
      },
      create: {
        testId: test1.id,
        questionId: q.id,
        sectionId: qData.sectionId,
        order: orderIndex,
        marks: qData.marks,
        negMarks: qData.negMarks,
      },
    });
    orderIndex++;
  }
  console.log(`✓ Seeded JEE-MOCK-01 with 10 questions across 2 sections`);

  // ==========================================
  // 2. QUADRATIC EQUATIONS CHAPTER TEST (CH-ALG-01)
  // ==========================================
  const test2 = await prisma.test.upsert({
    where: { code: "CH-ALG-01" },
    update: {
      title: "Quadratic Equations Chapter Mastery Test",
      description: "Class 11 Chapter-level timed drill focusing on Roots, Discriminant, Sign of Expressions, and Location of Roots.",
      type: "CHAPTER",
      status: "DRAFT",
      durationMin: 60,
      totalMarks: 20,
      passMarks: 10,
      lateStartRule: "REDUCE_TIME",
      maxAttempts: 2,
      resultMode: "INSTANT",
      solutionMode: "AFTER_SUBMIT",
      isFreePreview: false,
      seriesId: class11Series?.id || null,
      instructions: "5 Questions covering core algebraic properties. Negative marking of 1 mark applies for wrong options.",
    },
    create: {
      code: "CH-ALG-01",
      title: "Quadratic Equations Chapter Mastery Test",
      description: "Class 11 Chapter-level timed drill focusing on Roots, Discriminant, Sign of Expressions, and Location of Roots.",
      type: "CHAPTER",
      status: "DRAFT",
      durationMin: 60,
      totalMarks: 20,
      passMarks: 10,
      lateStartRule: "REDUCE_TIME",
      maxAttempts: 2,
      resultMode: "INSTANT",
      solutionMode: "AFTER_SUBMIT",
      isFreePreview: false,
      seriesId: class11Series?.id || null,
      instructions: "5 Questions covering core algebraic properties. Negative marking of 1 mark applies for wrong options.",
    },
  });

  let sec2 = await prisma.testSection.findFirst({
    where: { testId: test2.id, name: "Section 1 - Algebra Concepts" },
  });
  if (!sec2) {
    sec2 = await prisma.testSection.create({
      data: {
        testId: test2.id,
        name: "Section 1 - Algebra Concepts",
        order: 1,
      },
    });
  }

  const ch2Questions = [
    {
      code: "CH-ALG-Q01",
      type: "MCQ_SINGLE",
      subject: "Mathematics",
      chapter: "Quadratic Equations",
      difficulty: "EASY",
      stem: "If the discriminant $\\Delta = b^2 - 4ac < 0$ and $a > 0$, then the parabola $y = ax^2 + bx + c$:",
      options: [
        { id: "A", text: "Lies strictly above the $x$-axis for all $x \\in \\mathbb{R}$" },
        { id: "B", text: "Lies strictly below the $x$-axis for all $x \\in \\mathbb{R}$" },
        { id: "C", text: "Touches the $x$-axis at one point" },
        { id: "D", text: "Crosses the $x$-axis at two distinct points" },
      ],
      correct: { answer: "A" },
      explanation: "When $a > 0$, the parabola opens upwards. With $\\Delta < 0$, it has no real roots, meaning it never touches or crosses the $x$-axis. Hence $y > 0$ for all real $x$.",
      sectionId: sec2.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "CH-ALG-Q02",
      type: "MCQ_SINGLE",
      subject: "Mathematics",
      chapter: "Quadratic Equations",
      difficulty: "MEDIUM",
      stem: "If $\\alpha$ and $\\beta$ are the roots of $x^2 - 5x + 6 = 0$, what is the value of $\\alpha^3 + \\beta^3$?",
      options: [
        { id: "A", text: "$35$" },
        { id: "B", text: "$45$" },
        { id: "C", text: "$55$" },
        { id: "D", text: "$25$" },
      ],
      correct: { answer: "A" },
      explanation: "Roots are 2 and 3. $\\alpha^3 + \\beta^3 = 2^3 + 3^3 = 8 + 27 = 35$. Alternatively, $(\\alpha+\\beta)^3 - 3\\alpha\\beta(\\alpha+\\beta) = 5^3 - 3(6)(5) = 125 - 90 = 35$.",
      sectionId: sec2.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "CH-ALG-Q03",
      type: "MCQ_MULTI",
      subject: "Mathematics",
      chapter: "Quadratic Equations",
      difficulty: "HARD",
      stem: "Consider the equation $x^2 - 2kx + k^2 - 1 = 0$. Which of the following statements are ALWAYS true for all real $k$?",
      options: [
        { id: "A", text: "Both roots are real and distinct" },
        { id: "B", text: "The difference between the two roots is exactly $2$" },
        { id: "C", text: "One root is always positive and the other is negative" },
        { id: "D", text: "The discriminant is strictly positive" },
      ],
      correct: { answer: ["A", "B", "D"] },
      explanation: "$\\Delta = 4k^2 - 4(k^2 - 1) = 4 > 0$. Since $\\Delta = 4 > 0$, roots are real and distinct (A & D true). The difference of roots is $\\frac{\\sqrt{\\Delta}}{|a|} = \\frac{2}{1} = 2$ (B true). Sign of roots depends on $k$, so C is not generally true.",
      sectionId: sec2.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "CH-ALG-Q04",
      type: "TRUE_FALSE",
      subject: "Mathematics",
      chapter: "Quadratic Equations",
      difficulty: "EASY",
      stem: "True or False: If a quadratic equation with rational coefficients has one root as $2 + \\sqrt{3}$, then the other root must be $2 - \\sqrt{3}$.",
      options: [
        { id: "A", text: "True" },
        { id: "B", text: "False" },
      ],
      correct: { answer: "A" },
      explanation: "For polynomial equations with rational coefficients, irrational roots containing square roots always occur in conjugate pairs.",
      sectionId: sec2.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "CH-ALG-Q05",
      type: "NUMERIC",
      subject: "Mathematics",
      chapter: "Quadratic Equations",
      difficulty: "MEDIUM",
      stem: "Find the maximum real value of $y = -x^2 + 6x - 5$.",
      options: null,
      correct: { answer: 4, min: 3.99, max: 4.01 },
      explanation: "Vertex occurs at $x = -b/(2a) = -6 / (-2) = 3$. Value at $x = 3$ is $-(3)^2 + 6(3) - 5 = -9 + 18 - 5 = 4$.",
      sectionId: sec2.id,
      marks: 4,
      negMarks: 0,
    },
  ];

  let orderIndex2 = 1;
  for (const qData of ch2Questions) {
    const q = await prisma.question.upsert({
      where: { code: qData.code },
      update: {
        stem: qData.stem,
        options: qData.options,
        correct: qData.correct,
        explanation: qData.explanation,
        subject: qData.subject,
        chapter: qData.chapter,
        difficulty: qData.difficulty,
        type: qData.type,
        createdById: creatorId,
      },
      create: {
        code: qData.code,
        stem: qData.stem,
        options: qData.options,
        correct: qData.correct,
        explanation: qData.explanation,
        subject: qData.subject,
        chapter: qData.chapter,
        difficulty: qData.difficulty,
        type: qData.type,
        createdById: creatorId,
      },
    });

    await prisma.testQuestion.upsert({
      where: {
        testId_questionId: {
          testId: test2.id,
          questionId: q.id,
        },
      },
      update: {
        sectionId: qData.sectionId,
        order: orderIndex2,
        marks: qData.marks,
        negMarks: qData.negMarks,
      },
      create: {
        testId: test2.id,
        questionId: q.id,
        sectionId: qData.sectionId,
        order: orderIndex2,
        marks: qData.marks,
        negMarks: qData.negMarks,
      },
    });
    orderIndex2++;
  }
  console.log(`✓ Seeded CH-ALG-01 with 5 questions`);

  // ==========================================
  // 3. FREE DIAGNOSTIC MOCK (DIAG-01)
  // ==========================================
  const test3 = await prisma.test.upsert({
    where: { code: "DIAG-01" },
    update: {
      title: "SmartNum Diagnostic Aptitude & Concept Mock",
      description: "Quick 45-minute diagnostic test to assess mathematical aptitude, numerical proficiency, and logical reasoning.",
      type: "DIAGNOSTIC",
      status: "DRAFT",
      durationMin: 45,
      totalMarks: 20,
      passMarks: 8,
      lateStartRule: "FULL_TIME",
      maxAttempts: 3,
      resultMode: "INSTANT",
      solutionMode: "AFTER_SUBMIT",
      isFreePreview: true,
      seriesId: diagSeries?.id || null,
      instructions: "Diagnostic test with instant analysis. 5 questions assessing multiple mathematical aptitudes.",
    },
    create: {
      code: "DIAG-01",
      title: "SmartNum Diagnostic Aptitude & Concept Mock",
      description: "Quick 45-minute diagnostic test to assess mathematical aptitude, numerical proficiency, and logical reasoning.",
      type: "DIAGNOSTIC",
      status: "DRAFT",
      durationMin: 45,
      totalMarks: 20,
      passMarks: 8,
      lateStartRule: "FULL_TIME",
      maxAttempts: 3,
      resultMode: "INSTANT",
      solutionMode: "AFTER_SUBMIT",
      isFreePreview: true,
      seriesId: diagSeries?.id || null,
      instructions: "Diagnostic test with instant analysis. 5 questions assessing multiple mathematical aptitudes.",
    },
  });

  let sec3 = await prisma.testSection.findFirst({
    where: { testId: test3.id, name: "Diagnostic Section" },
  });
  if (!sec3) {
    sec3 = await prisma.testSection.create({
      data: {
        testId: test3.id,
        name: "Diagnostic Section",
        order: 1,
      },
    });
  }

  const diagQuestions = [
    {
      code: "DIAG-Q01",
      type: "MCQ_SINGLE",
      subject: "Quantitative Aptitude",
      chapter: "Ratios & Proportions",
      difficulty: "EASY",
      stem: "If the ratio of two numbers is $3:5$ and their sum is $64$, what is the larger number?",
      options: [
        { id: "A", text: "$24$" },
        { id: "B", text: "$40$" },
        { id: "C", text: "$45$" },
        { id: "D", text: "$36$" },
      ],
      correct: { answer: "B" },
      explanation: "$3x + 5x = 64 \\implies 8x = 64 \\implies x = 8$. Larger number is $5 \\times 8 = 40$.",
      sectionId: sec3.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "DIAG-Q02",
      type: "MCQ_SINGLE",
      subject: "Mathematics",
      chapter: "Arithmetic Progression",
      difficulty: "EASY",
      stem: "The $10^{\\text{th}}$ term of the AP: $3, 7, 11, 15, \\dots$ is:",
      options: [
        { id: "A", text: "$39$" },
        { id: "B", text: "$43$" },
        { id: "C", text: "$36$" },
        { id: "D", text: "$41$" },
      ],
      correct: { answer: "A" },
      explanation: "$a_n = a + (n-1)d = 3 + (10 - 1)(4) = 3 + 36 = 39$.",
      sectionId: sec3.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "DIAG-Q03",
      type: "NUMERIC",
      subject: "Mathematics",
      chapter: "Geometry",
      difficulty: "MEDIUM",
      stem: "In a right-angled triangle, the lengths of the two legs are $6\\text{ cm}$ and $8\\text{ cm}$. What is the length of the hypotenuse in $\\text{cm}$?",
      options: null,
      correct: { answer: 10, min: 9.99, max: 10.01 },
      explanation: "By Pythagoras Theorem: $c = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10\\text{ cm}$.",
      sectionId: sec3.id,
      marks: 4,
      negMarks: 0,
    },
    {
      code: "DIAG-Q04",
      type: "TRUE_FALSE",
      subject: "Mathematics",
      chapter: "Number Systems",
      difficulty: "EASY",
      stem: "True or False: Every integer is also a rational number.",
      options: [
        { id: "A", text: "True" },
        { id: "B", text: "False" },
      ],
      correct: { answer: "A" },
      explanation: "Any integer $n$ can be expressed in the form $p/q$ as $n/1$, where $q = 1 \\neq 0$.",
      sectionId: sec3.id,
      marks: 4,
      negMarks: 1,
    },
    {
      code: "DIAG-Q05",
      type: "MCQ_SINGLE",
      subject: "Logical Reasoning",
      chapter: "Sequences",
      difficulty: "EASY",
      stem: "Find the missing number in the sequence: $2, 6, 12, 20, 30, \\,?$",
      options: [
        { id: "A", text: "$40$" },
        { id: "B", text: "$42$" },
        { id: "C", text: "$44$" },
        { id: "D", text: "$48$" },
      ],
      correct: { answer: "B" },
      explanation: "Differences are: $+4, +6, +8, +10$. Next difference is $+12$, giving $30 + 12 = 42$. Formula is $n(n+1)$.",
      sectionId: sec3.id,
      marks: 4,
      negMarks: 1,
    },
  ];

  let orderIndex3 = 1;
  for (const qData of diagQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qData.code },
      update: {
        stem: qData.stem,
        options: qData.options,
        correct: qData.correct,
        explanation: qData.explanation,
        subject: qData.subject,
        chapter: qData.chapter,
        difficulty: qData.difficulty,
        type: qData.type,
        createdById: creatorId,
      },
      create: {
        code: qData.code,
        stem: qData.stem,
        options: qData.options,
        correct: qData.correct,
        explanation: qData.explanation,
        subject: qData.subject,
        chapter: qData.chapter,
        difficulty: qData.difficulty,
        type: qData.type,
        createdById: creatorId,
      },
    });

    await prisma.testQuestion.upsert({
      where: {
        testId_questionId: {
          testId: test3.id,
          questionId: q.id,
        },
      },
      update: {
        sectionId: qData.sectionId,
        order: orderIndex3,
        marks: qData.marks,
        negMarks: qData.negMarks,
      },
      create: {
        testId: test3.id,
        questionId: q.id,
        sectionId: qData.sectionId,
        order: orderIndex3,
        marks: qData.marks,
        negMarks: qData.negMarks,
      },
    });
    orderIndex3++;
  }
  console.log(`✓ Seeded DIAG-01 with 5 questions`);

  console.log("Phase 8 sample test seeding completed successfully!");
}

seedTests()
  .catch((e) => {
    console.error("Error during test seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

