import { redirect } from "next/navigation";

// The actual frontend is served from public/index.html.
// This page redirects just in case Next.js intercepts the root route.
export default function Home() {
  redirect("/index.html");
}
