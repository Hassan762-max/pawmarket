"use client";

import { NotificationsInbox } from "@/components/notifications-inbox";

export default function AccountNotificationsPage() {
  return <NotificationsInbox title="Notifications" loginNext="/account/notifications" />;
}
