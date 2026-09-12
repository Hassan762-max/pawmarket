"use client";

import { VendorShell } from "@/components/vendor-shell";
import { NotificationsInbox } from "@/components/notifications-inbox";

export default function VendorNotificationsPage() {
  return (
    <VendorShell>
      <NotificationsInbox title="Notifications" loginNext="/vendor/notifications" />
    </VendorShell>
  );
}
