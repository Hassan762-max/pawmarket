import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    email?: boolean;
  }) {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? "",
        channel: input.email === false ? "IN_APP" : "IN_APP_EMAIL",
        emailSent: Boolean(input.email !== false),
      },
    });
    // Stub email: logged to console in lieu of SMTP
    if (input.email !== false) {
      const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
      console.log(`[email-stub] to=${user?.email} subject=${input.title} body=${input.body}`);
    }
    return row;
  }

  async notifyAdmins(input: {
    type: string;
    title: string;
    body: string;
    link?: string;
    email?: boolean;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { roles: { some: { role: { slug: "admin" } } } },
      select: { id: true },
    });
    return Promise.all(
      admins.map((admin) =>
        this.notify({
          userId: admin.id,
          type: input.type,
          title: input.title,
          body: input.body,
          link: input.link,
          email: input.email,
        }),
      ),
    );
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id?: string) {
    if (id) {
      await this.prisma.notification.updateMany({
        where: { id, userId },
        data: { readAt: new Date() },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    }
    return this.list(userId);
  }
}
