import { redirect } from "next/navigation";

export default function DealsPage() {
  redirect("/shop?onSale=1&sort=price_asc");
}
