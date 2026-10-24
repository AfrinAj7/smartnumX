import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

const text = z.string().trim().max(4000);
const mediaUrl = z.preprocess((val) => {
  if (typeof val !== "string") return "";
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (!trimmed.includes(":") && !trimmed.startsWith("//")) {
    return `/${trimmed}`;
  }
  return trimmed;
}, z.string().trim().max(2048).refine(
  (value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value),
  "Use a site-relative or HTTPS media URL.",
));

const heroSlideSchema = z.object({
  eyebrow: text.max(120),
  headline: text.min(4).max(110),
  copy: text.max(400),
  primaryLabel: text.max(48),
  secondaryLabel: text.max(48),
  imageUrl: mediaUrl,
  imageAlt: text.max(240),
});

const trustMetricSchema = z.object({
  value: text.max(32),
  label: text.min(2).max(80),
  verified: z.boolean(),
});

const featureSchema = z.object({
  title: text.min(2).max(80),
  description: text.max(320),
});

const programSchema = z.object({
  title: text.min(2).max(80),
  description: text.max(320),
  badge: text.max(60).optional(),
  icon: text.max(20).optional(),
  imageUrl: mediaUrl.optional(),
  offerBadge: text.max(80).optional(),
  enabled: z.boolean(),
});

const planSchema = z.object({
  title: text.min(2).max(80),
  price: text.max(80),
  description: text.max(320),
  inclusions: z.array(text.max(100)).max(8),
  enabled: z.boolean(),
});

const curriculumSchema = z.object({
  title: text.min(2).max(80),
  summary: text.max(300),
  strengths: z.array(text.max(120)).max(5),
  imageUrl: mediaUrl,
  altText: text.max(240),
  badge: text.max(60),
  enabled: z.boolean(),
});

const facultySchema = z.object({
  name: text.max(250),
  subject: text.max(250),
  qualification: text.max(1000),
  experience: text.max(1000),
  photoUrl: mediaUrl,
  approved: z.boolean(),
});

const testimonialSchema = z.object({
  quote: text.max(500),
  name: text.max(80),
  learnerClass: text.max(80),
  relation: z.enum(["Parent", "Student"]),
  approved: z.boolean(),
});

const faqSchema = z.object({
  question: text.min(4).max(180),
  answer: text.max(1200),
  published: z.boolean(),
});

const demoVideoSchema = z.object({
  title: text.max(120),
  subject: text.max(80),
  classLabel: text.max(80),
  videoUrl: mediaUrl,
  thumbnailUrl: mediaUrl,
  altText: text.max(240),
  published: z.boolean(),
});

export const homepageContentSchema = z.object({
  siteName: text.min(2).max(60),
  unitLabel: text.max(80),
  tagline: text.max(180),
  heroSlides: z.array(heroSlideSchema).min(1).max(3),
  metrics: z.array(trustMetricSchema).max(4),
  features: z.array(featureSchema).max(10),
  programs: z.array(programSchema).max(10),
  plans: z.array(planSchema).max(8),
  curricula: z.array(curriculumSchema).max(10),
  aboutHeadline: text.max(140),
  aboutParagraphs: z.array(text.max(1000)).max(5),
  faculty: z.array(facultySchema).max(50),
  testimonials: z.array(testimonialSchema).max(20),
  faqs: z.array(faqSchema).max(20),
  demoVideos: z.array(demoVideoSchema).max(12),
  contact: z.object({
    address: text.max(240),
    mapsUrl: mediaUrl.optional().default("https://share.google/8gHRuZQQxRuYAkqVd"),
    phone: text.max(40),
    secondaryPhone: text.max(40),
    email: z.string().trim().email().max(254),
    whatsapp: text.max(40),
    instagramUrl: mediaUrl,
    facebookUrl: mediaUrl,
    youtubeUrl: mediaUrl,
    linkedInUrl: mediaUrl,
  }),
});

export type HomepageContent = z.infer<typeof homepageContentSchema>;

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  siteName: "SmartNum",
  unitLabel: "SmartNum Learning Space",
  tagline: "Mathematics made clearer",
  heroSlides: [
    {
      eyebrow: "SMARTNUM · CLASSES 9–12th & COMPETITIVE PATHWAYS",
      headline: "Unlock the patterns behind mathematics.",
      copy: "Foundational Courses, Any Board, IIT-JEE Mains & Advanced, and Olympiads. Build understanding with clear explanations and step-by-step problem breakdown.",
      primaryLabel: "Explore programmes",
      secondaryLabel: "Book a free assessment",
      imageUrl: "",
      imageAlt: "",
    },
    {
      eyebrow: "ONE CLEAR IDEA AT A TIME",
      headline: "When maths feels difficult, begin with one step.",
      copy: "Revisit a recorded lesson, practise a worksheet, and return to the chapter when you are ready for another look.",
      primaryLabel: "Book a free demo",
      secondaryLabel: "See how learning works",
      imageUrl: "",
      imageAlt: "",
    },
    {
      eyebrow: "A LEARNING PLAN FOR EVERY GOAL",
      headline: "Structured coaching for Classes 9–12th & Competitions.",
      copy: "Comprehensive support for Classes 9–12th (Any Board), Foundational Courses, IIT-JEE Mains, IIT-JEE Advanced, and Olympiads in Indirapuram, Ghaziabad.",
      primaryLabel: "Ask about programmes",
      secondaryLabel: "Book a free assessment",
      imageUrl: "",
      imageAlt: "",
    },
  ],
  metrics: [
    { value: "1000+", label: "Students enrolled", verified: true },
    { value: "75+", label: "Professional tutors", verified: true },
    { value: "Any Board", label: "CBSE, ICSE, State & International Boards", verified: true },
    { value: "Classes 9–12th", label: "Foundational, JEE & Olympiads", verified: true },
  ],
  features: [
    { title: "Smart classrooms", description: "Tech-supported classrooms help teachers make abstract maths ideas easier to see and understand." },
    { title: "Small batches", description: "Smaller groups leave more room for questions, individual attention and personalized guidance." },
    { title: "Self-paced learning path", description: "Follow a structured learning path with recorded classes so students can learn at their own pace." },
    { title: "One-to-one doubt sessions", description: "Dedicated 1-on-1 time with teachers to clear difficult concepts and exam queries." },
    { title: "CCTV-enabled centre", description: "Full CCTV surveillance ensures a safe, secure, and transparent learning environment." },
    { title: "Progress report cards", description: "Periodic mock exams and tailor-made progress report cards to track growth and next steps." },
  ],
  programs: [
    {
      title: "Classes 9–12 Tuition",
      badge: "GRADES 9–12",
      icon: "🎓",
      description: "Comprehensive coaching across CBSE, ICSE, State & IB boards.",
      offerBadge: "Free Demo Class Available",
      imageUrl: "",
      enabled: true,
    },
    {
      title: "NEET Preparation",
      badge: "NEET",
      icon: "✚",
      description: "Focused coaching with strong conceptual foundation and practice.",
      offerBadge: "Free Demo Class Available",
      imageUrl: "",
      enabled: true,
    },
    {
      title: "IIT-JEE Preparation",
      badge: "IIT-JEE",
      icon: "⚛",
      description: "Advanced problem-solving with deep conceptual clarity.",
      offerBadge: "Free Demo Class Available",
      imageUrl: "",
      enabled: true,
    },
    {
      title: "Focused Learning",
      badge: "SMALL BATCHES",
      icon: "👥",
      description: "Learn in small batches for better attention and results.",
      offerBadge: "",
      imageUrl: "",
      enabled: true,
    },
    {
      title: "Doubt Sessions",
      badge: "1-ON-1",
      icon: "❓",
      description: "Personalised 1-on-1 sessions to clear every doubt.",
      offerBadge: "",
      imageUrl: "",
      enabled: true,
    },
    {
      title: "Self-Paced Learning Path",
      badge: "SELF-PACED",
      icon: "▶",
      description: "Structured modules to learn at your own pace, anytime, anywhere.",
      offerBadge: "",
      imageUrl: "",
      enabled: true,
    },
  ],
  plans: [
    { title: "Foundational & Board Tuition (Classes 9–12th)", price: "Contact for fee details", description: "Small-batch guidance for Classes 9–12th across Any Board with 1-on-1 doubt clearing.", inclusions: ["Smart classroom access", "Foundational & Board syllabus coverage", "One-to-one doubt sessions", "Monthly progress report cards"], enabled: true },
    { title: "IIT-JEE Mains, Advanced & Olympiads", price: "Contact for fee details", description: "Advanced mathematical and analytical training for JEE Mains, JEE Advanced, and Olympiads.", inclusions: ["High-level problem solving", "Mock exam series & Olympiad prep", "1-on-1 mentorship", "Progress report cards"], enabled: true },
  ],
  curricula: [
    { title: "CBSE", summary: "SmartNum support aligned with CBSE syllabus for Classes 9–12th.", strengths: ["NCERT concept alignment", "Worked board examples", "Practice question sets"], imageUrl: "", altText: "CBSE board curriculum", badge: "Popular", enabled: true },
    { title: "ICSE / ISC", summary: "Deep conceptual coverage tailored to ICSE & ISC standards.", strengths: ["In-depth theory breakdown", "Analytical problem solving", "Past paper practice"], imageUrl: "", altText: "ICSE board curriculum", badge: "Comprehensive", enabled: true },
    { title: "IGCSE / IB / Global", summary: "Global curriculum framework support for international board students.", strengths: ["Inquiry-based learning", "Structured problem sets", "1-on-1 guidance"], imageUrl: "", altText: "IGCSE IB curriculum", badge: "International", enabled: true },
    { title: "State & Any Board", summary: "Tailored math tuition aligned with UP State Board and Any Board curriculum.", strengths: ["Syllabus-focused recaps", "Local language support options", "Board exam practice"], imageUrl: "", altText: "State Board curriculum", badge: "Regional", enabled: true },
  ],
  aboutHeadline: "Shaping future leaders through focused guidance.",
  aboutParagraphs: [
    "SmartNum is a dedicated learning space in Indirapuram, Ghaziabad for students in Classes 9–12th (Any Board), offering specialized coaching for Foundational Courses, IIT-JEE Mains, IIT-JEE Advanced, and Olympiads.",
    "Our campus features air-conditioned smart classrooms, full CCTV surveillance, small batch sizes, self-paced recorded learning paths, and 1-on-1 doubt clearing sessions.",
    "We believe in continuous assessment, curated study materials, and transparent progress reports for parents. Contact us to schedule a free demo session."
  ],
  faculty: [
    {
      name: "Dr. Sweta Agrawal",
      subject: "Higher Mathematics & Competitive Exams",
      qualification: "Ph.D. | M.Sc in Mathematics | Assistant Professor | Lead Educator",
      experience:
        "Accomplished mathematician and researcher with a Ph.D. in Mathematics and extensive academic experience as an Assistant Professor. She specializes in breaking down complex concepts for Board exams, IIT-JEE Mains & Advanced, and Olympiad aspirants through conceptual clarity and first principles.",
      photoUrl:
        "https://content.jdmagicbox.com/v2/comp/meerut/y7/9999px121.x121.240511122551.s5y7/catalogue/dr-shweta-agarwal-garh-rd-meerut-meerut-cancer-hospitals-pftrp2h0ro.jpg",
      approved: true,
    },
    {
      name: "Senior JEE Problem-Solving Specialist",
      subject: "Advanced Mathematics & JEE Mains / Advanced",
      qualification: "M.Tech / M.Sc Mathematics · 10+ Years Mentorship",
      experience:
        "Specialized in multi-concept synthesis linking coordinate geometry, algebra, and vectors. Expert in error-reduction techniques and time management strategies for IIT-JEE aspirants.",
      photoUrl: "/images/why-smartnum-tutor.jpg",
      approved: true,
    },
    {
      name: "Foundation & Olympiad Mentor",
      subject: "Mathematics & Logical Reasoning (Classes 9–10)",
      qualification: "B.Tech & Olympiad Coach · 8+ Years Experience",
      experience:
        "Dedicated to building rock-solid mathematical intuition for Classes 9 and 10 students. Focuses on elimination of fear in algebra, geometry proofs, and Olympiad-level puzzle solving.",
      photoUrl: "/images/Confident Mathematics Teacher Portrait.png",
      approved: true,
    },
  ],
  testimonials: [
    {
      name: "Arnav Goel",
      quote:
        "Shweta ma'am is the reason I survived through jee period. I am currently studying at IIT Kanpur, and Shweta ma'am is still one of the best teacher's I've had. I would definitely recommend joining this tuition for JEE and boards.",
      approved: true,
      relation: "Student",
      learnerClass: "JEE",
    },
    {
      name: "Jaydeep Kumar Verma",
      quote:
        "The Magician Of Mathematics, How Easily sweta mam teaches us just look so smooth.",
      approved: true,
      relation: "Student",
      learnerClass: "12",
    },
    {
      name: "Ananya Goel",
      quote:
        "The best tuition you can take for maths! Shweta ma'am is the reason I cracked JEE Advance to get into IIT! Also I got 99% in maths in 12th due to her giving us many tests for practise!\n\nRecommended for any student taking up PCM in 12th or preparing for IIT JEE",
      approved: true,
      relation: "Student",
      learnerClass: "IIT JEE",
    },
    {
      name: "Nibha B",
      quote:
        "Studying at SmartNum Maths Academy completely transformed my JEE preparation. Shweta ma'am focuses heavily on concept clarity and previous year questions (PYQs). Thanks to her rigorous practice tests and personalized doubt-clearing sessions, I was able to clear JEE Advanced and secure a seat at IIT. Highly recommend for anyone looking for the best math coaching for Class 11 and 12!",
      approved: true,
      relation: "Student",
      learnerClass: "12",
    },
    {
      name: "Afrin J",
      quote:
        "If you want to excel in Class 12 CBSE Maths, SmartNum is the perfect place. Shweta ma'am provides excellent study material and conducts regular chapter-wise mock tests that build real confidence. I scored a 99% in my board exams entirely because of her dedicated guidance. She is undoubtedly one of the best math teachers for PCM students.",
      approved: true,
      relation: "Student",
      learnerClass: "12",
    },
  ],
  faqs: [
    { question: "Which classes and competitive exams does SmartNum support?", answer: "SmartNum supports Classes 9th to 12th for Any Board, along with targeted preparation for Foundational Courses, IIT-JEE Mains, IIT-JEE Advanced, and Olympiads.", published: true },
    { question: "Which educational boards are covered?", answer: "We cover Any Board including CBSE, ICSE/ISC, UP State Board, and IB/IGCSE international curricula.", published: true },
    { question: "What safety features does the center provide?", answer: "Our Indirapuram center features full CCTV surveillance, air-conditioned smart classrooms, and monitored learning spaces.", published: true },
    { question: "Are one-to-one doubt sessions available?", answer: "Yes! Students can book dedicated 1-on-1 doubt clearing sessions with our faculty before exams or weekly tests.", published: true },
    { question: "Is self-paced learning available?", answer: "Yes, students get access to recorded class modules and learning paths so they can review complex topics at their own pace.", published: true },
    { question: "How do batch sizes work at SmartNum?", answer: "We maintain small batch sizes to ensure every student receives personalized attention and teacher interaction.", published: true },
    { question: "Where is SmartNum located and how can I book a free demo?", answer: "We are located at 04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014. You can book a free demo class by submitting our online form or calling +91 99589 47774 / +91 88004 05640.", published: true },
  ],
  demoVideos: [
    {
      title: "Class 10 Board Excellence: Visualizing Quadratic Equations",
      subject: "Mathematics",
      classLabel: "Class 10 · Board Exam Prep",
      videoUrl: "https://www.youtube.com/watch?v=yXpQo9168C4",
      thumbnailUrl: "/images/smartnum-classroom-backdrop.jpg",
      altText: "SmartNum Class 10 Mathematics demo class",
      published: true,
    },
    {
      title: "Foundations of Calculus: Limits & First Principles",
      subject: "Mathematics",
      classLabel: "Class 11 & 12 · Core Calculus",
      videoUrl: "https://www.youtube.com/watch?v=yXpQo9168C4",
      thumbnailUrl: "/images/Students in a Bright EdTech Wave Background.png",
      altText: "SmartNum Class 11 and 12 Calculus lecture preview",
      published: true,
    },
    {
      title: "IIT-JEE Advanced Mentorship: Multi-Concept Problem Breakdown",
      subject: "IIT-JEE Maths",
      classLabel: "Target JEE Mains & Advanced",
      videoUrl: "https://www.youtube.com/watch?v=yXpQo9168C4",
      thumbnailUrl: "/images/why-smartnum-tutor.jpg",
      altText: "SmartNum IIT-JEE advanced problem solving demo",
      published: true,
    },
  ],
  contact: {
    address: "04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014",
    mapsUrl: "https://share.google/8gHRuZQQxRuYAkqVd",
    phone: "+91 99589 47774",
    secondaryPhone: "+91 88004 05640",
    email: "gosmartnum@gmail.com",
    whatsapp: "+91 99589 47774",
    instagramUrl: "https://www.instagram.com/smartnumofficial/",
    facebookUrl: "https://www.facebook.com/profile.php?id=61594903500934",
    youtubeUrl: "https://www.youtube.com/@GoSmartNum",
    linkedInUrl: "https://www.linkedin.com/company/smartnum/about/",
  },
};

export function parseHomepageContent(value: unknown): HomepageContent {
  const parsed = homepageContentSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_HOMEPAGE_CONTENT;
}

export async function getHomepageContent(database: PrismaClient) {
  if (!process.env.DATABASE_URL) return DEFAULT_HOMEPAGE_CONTENT;
  try {
    const setting = await database.setting.findUnique({ where: { key: "public.homepage" } });
    return setting ? parseHomepageContent(setting.value) : DEFAULT_HOMEPAGE_CONTENT;
  } catch {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

export async function saveHomepageContent(
  input: unknown,
  actorId: string,
  database: PrismaClient,
) {
  const content = homepageContentSchema.parse(input);
  return database.$transaction(async (transaction) => {
    const previous = await transaction.setting.findUnique({ where: { key: "public.homepage" } });
    await transaction.setting.upsert({
      where: { key: "public.homepage" },
      create: { key: "public.homepage", value: content as Prisma.InputJsonValue },
      update: { value: content as Prisma.InputJsonValue },
    });
    await transaction.auditLog.create({
      data: {
        actorId,
        action: "homepage.content.updated",
        entityType: "Setting",
        entityId: "public.homepage",
        ...(previous ? { before: previous.value as Prisma.InputJsonValue } : {}),
        after: content as Prisma.InputJsonValue,
      },
    });
    return content;
  });
}