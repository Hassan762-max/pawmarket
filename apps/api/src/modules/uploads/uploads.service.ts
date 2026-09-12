import { BadRequestException, Injectable } from "@nestjs/common";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

@Injectable()
export class UploadsService {
  readonly root = join(process.cwd(), "uploads");

  constructor() {
    if (!existsSync(this.root)) mkdirSync(this.root, { recursive: true });
  }

  assertImage(file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException({ code: "NO_FILE", message: "Choose an image to upload." });
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException({
        code: "INVALID_IMAGE",
        message: "Only JPEG, PNG, WebP, or GIF images are allowed.",
      });
    }
    return {
      filename: file.filename,
      // Relative so storefront/LAN/Render hosts resolve correctly via mediaUrl()
      url: `/api/v1/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
