"use client";

import { NotificationsInbox } from "@/components/notifications-inbox";

export default function AdminNotificationsPage() {
  return <NotificationsInbox title="Notifications" loginNext="/admin/notifications" />;
}
