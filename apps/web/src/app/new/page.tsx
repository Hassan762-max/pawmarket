import { redirect } from "next/navigation";

export default function NewPage() {
  redirect("/shop?sort=newest");
}
