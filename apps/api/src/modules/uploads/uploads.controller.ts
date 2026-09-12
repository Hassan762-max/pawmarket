import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname, join } from "path";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UploadsService } from "./uploads.service";

const UPLOAD_ROOT = join(process.cwd(), "uploads");

function ensureUploadRoot() {
  if (!existsSync(UPLOAD_ROOT)) mkdirSync(UPLOAD_ROOT, { recursive: true });
}

@Controller()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("uploads")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadRoot();
          cb(null, UPLOAD_ROOT);
        },
        filename: (_req, file, cb) => {
          const fromMime: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
          };
          let ext = fromMime[file.mimetype] || extname(file.originalname).toLowerCase();
          if (ext === ".jpeg") ext = ".jpg";
          if (![".jpg", ".png", ".webp", ".gif"].includes(ext)) ext = ".jpg";
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
        cb(null, ok);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.assertImage(file);
  }
}
