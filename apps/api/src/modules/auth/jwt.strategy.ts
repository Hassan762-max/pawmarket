import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "pawmarket-dev-access-secret-min-32-chars",
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    roles: string[];
    vendorId: string | null;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, vendor: { select: { id: true } } },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: "SESSION_EXPIRED",
        message: "Session expired. Please sign in again.",
      });
    }
    return {
      userId: user.id,
      email: user.email,
      roles: payload.roles,
      vendorId: user.vendor?.id ?? payload.vendorId,
    };
  }
}
