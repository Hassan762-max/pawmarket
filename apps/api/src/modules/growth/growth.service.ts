import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GrowthService {
  constructor(private readonly prisma: PrismaService) {}

  private codeFor(userId: string) {
    return createHash("sha1").update(userId).digest("hex").slice(0, 8).toUpperCase();
  }

  async ensureReferralCode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (user.referralCode) return user.referralCode;
    const code = this.codeFor(userId);
    await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }

  async referralStats(userId: string) {
    const code = await this.ensureReferralCode(userId);
    const invited = await this.prisma.user.count({ where: { referredById: userId } });
    return {
      code,
      sharePath: `/register?ref=${code}`,
      invited,
    };
  }

  async applyReferral(newUserId: string, code?: string) {
    if (!code?.trim()) return null;
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code.trim().toUpperCase() },
    });
    if (!referrer || referrer.id === newUserId) return null;
    await this.prisma.user.update({
      where: { id: newUserId },
      data: { referredById: referrer.id },
    });
    await this.notify(referrer.id, "REFERRAL", "Referral signup", "Someone joined with your referral code.", "/account/referral");
    return referrer.id;
  }

  listCampaigns() {
    return this.prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" } });
  }

  createCampaign(input: { name: string; subject: string; body: string; audience?: string }) {
    return this.prisma.emailCampaign.create({
      data: {
        name: input.name,
        subject: input.subject,
        body: input.body,
        audience: input.audience ?? "ALL_CUSTOMERS",
      },
    });
  }

  async sendCampaign(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException();
    if (campaign.status === "SENT") throw new BadRequestException("Already sent");
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, email: true },
      take: 500,
    });
    for (const u of users) {
      console.log(`[campaign-email] campaign=${campaign.id} to=${u.email} subject=${campaign.subject}`);
      await this.notify(u.id, "CAMPAIGN", campaign.subject, campaign.body);
    }
    return this.prisma.emailCampaign.update({
      where: { id },
      data: { status: "SENT", sentCount: users.length, sentAt: new Date() },
    });
  }

  listExperiments() {
    return this.prisma.experiment.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { assignments: true } } },
    });
  }

  async upsertExperiment(input: {
    key: string;
    name: string;
    variants?: string[];
    active?: boolean;
  }) {
    const variants = JSON.stringify(input.variants?.length ? input.variants : ["A", "B"]);
    return this.prisma.experiment.upsert({
      where: { key: input.key },
      create: { key: input.key, name: input.name, variants, active: input.active ?? true },
      update: { name: input.name, variants, active: input.active ?? true },
    });
  }

  async assignVariant(key: string, visitorKey: string, userId?: string | null) {
    const exp = await this.prisma.experiment.findUnique({ where: { key } });
    if (!exp || !exp.active) return { key, variant: "A", active: false };
    const existing = await this.prisma.experimentAssignment.findUnique({
      where: { experimentId_visitorKey: { experimentId: exp.id, visitorKey } },
    });
    if (existing) return { key, variant: existing.variant, active: true };
    const variants = JSON.parse(exp.variants) as string[];
    const pick = variants[Math.abs(this.hash(visitorKey + key)) % variants.length] ?? "A";
    await this.prisma.experimentAssignment.create({
      data: {
        experimentId: exp.id,
        visitorKey,
        variant: pick,
        userId: userId ?? null,
      },
    });
    return { key, variant: pick, active: true };
  }

  experimentStats(key: string) {
    return this.prisma.experiment.findUnique({
      where: { key },
      include: { assignments: { select: { variant: true } } },
    }).then(async (exp) => {
      if (!exp) throw new NotFoundException();
      const counts: Record<string, number> = {};
      for (const a of exp.assignments) counts[a.variant] = (counts[a.variant] ?? 0) + 1;
      return { key: exp.key, name: exp.name, active: exp.active, counts };
    });
  }

  newVisitorKey() {
    return randomBytes(12).toString("hex");
  }

  private hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  private async notify(userId: string, type: string, title: string, body: string, link = "") {
    await this.prisma.notification.create({
      data: { userId, type, title, body, link, channel: "IN_APP_EMAIL", emailSent: true },
    });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    console.log(`[email-stub] to=${user?.email} subject=${title}`);
  }
}
