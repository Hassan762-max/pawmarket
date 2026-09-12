import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { GrowthService } from "../growth/growth.service";
import { NotificationsService } from "../ops/notifications.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly growth: GrowthService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    referralCode?: string;
  }) {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (exists) throw new ConflictException({ code: "EMAIL_TAKEN", message: "Email already registered." });
    const customerRole = await this.prisma.role.findUnique({ where: { slug: "customer" } });
    if (!customerRole) throw new ConflictException("Roles not seeded");
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, 10),
        firstName: input.firstName,
        lastName: input.lastName,
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: customerRole.id } },
      },
      include: { roles: { include: { role: true } } },
    });
    await this.growth.applyReferral(user.id, input.referralCode);
    await this.growth.ensureReferralCode(user.id);

    await this.notifications.notify({
      userId: user.id,
      type: "WELCOME",
      title: "Welcome to PawMarket",
      body: "Your account is ready. Browse shops, save favorites, and checkout anytime.",
      link: "/shop",
    });
    await this.notifications.notifyAdmins({
      type: "USER_SIGNUP",
      title: "New customer joined",
      body: `${user.firstName} ${user.lastName} (${user.email}) just created an account.`,
      link: "/admin",
    });

    return this.tokenResponse(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } }, vendor: true, staffMemberships: true },
    });
    if (!user) throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Invalid email or password." });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Invalid email or password." });
    return this.tokenResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        vendor: { include: { stores: true } },
        staffMemberships: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return this.publicUser({
      ...user,
      vendorIdResolved: user.vendor?.id ?? user.staffMemberships[0]?.vendorId ?? null,
    });
  }

  private tokenResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: { role: { slug: string } }[];
    vendor?: { id: string; status?: string; stores?: { id: string; slug: string; name: string; status: string }[] } | null;
    staffMemberships?: { vendorId: string }[];
  }) {
    const vendorId = user.vendor?.id ?? user.staffMemberships?.[0]?.vendorId ?? null;
    const roles = user.roles.map((r) => r.role.slug);
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      roles,
      vendorId,
    });
    return {
      accessToken,
      user: this.publicUser({ ...user, vendorIdResolved: vendorId }),
    };
  }

  private publicUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: { role: { slug: string } }[];
    vendor?: {
      id: string;
      status?: string;
      stores?: { id: string; slug: string; name: string; status?: string }[];
    } | null;
    vendorIdResolved?: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((r) => r.role.slug),
      vendorId: user.vendor?.id ?? user.vendorIdResolved ?? null,
      vendorStatus: user.vendor?.status ?? null,
      stores: user.vendor?.stores ?? [],
    };
  }
}
