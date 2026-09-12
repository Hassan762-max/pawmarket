import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { EnvelopeInterceptor } from "./common/envelope.interceptor";
import {
  assertProdSecrets,
  createRateLimit,
  SecurityHeadersMiddleware,
} from "./common/security";
import { initObservability } from "./common/observability";
import { UploadsService } from "./modules/uploads/uploads.service";

async function bootstrap() {
  assertProdSecrets();
  initObservability();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploads = app.get(UploadsService);
  app.useStaticAssets(uploads.root, { prefix: "/api/v1/uploads" });
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.use(new SecurityHeadersMiddleware().use.bind(new SecurityHeadersMiddleware()));
  app.use(createRateLimit(60_000, Number(process.env.RATE_LIMIT_MAX ?? 180)));

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      // Dev / LAN: allow private network hosts hitting the Next app
      if (
        process.env.NODE_ENV !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(
          origin,
        )
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new EnvelopeInterceptor());

  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
    const swagger = new DocumentBuilder()
      .setTitle("PawMarket API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));
  }

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port);
  console.log(`PawMarket API http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
    console.log(`Swagger        http://localhost:${port}/api/docs`);
  }
}

bootstrap();
