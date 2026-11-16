import { redirect } from "next/navigation";

export default async function CourseSlugRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/batches/${slug}`);
}
