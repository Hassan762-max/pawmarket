import { redirect } from "next/navigation";

export default function BestSellersPage() {
  redirect("/shop?sort=best_selling");
}
