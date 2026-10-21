import { SmartNumLandingView } from "@/web-client/views/SmartNumLandingView";

export const metadata = {
  title: "SmartNum | Mathematics made clearer",
  description: "Build maths understanding with clear explanations, worked examples and purposeful practice through SmartNum.",
  openGraph: {
    title: "SmartNum | Mathematics made clearer",
    description: "Build maths understanding with clear explanations, worked examples and purposeful practice through SmartNum.",
    type: "website" as const,
  },
};

export default function HomePage() {
  return <SmartNumLandingView />;
}