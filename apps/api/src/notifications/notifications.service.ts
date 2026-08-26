import { Injectable } from "@nestjs/common";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(recipientUserId: string) {
    return this.prisma.notification.findMany({
      where: { recipientUserId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markRead(id: string, recipientUserId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id, recipientUserId },
      data: { readAt: new Date() },
    });
    if (updated.count === 0) throw new ApiError(404, "NOT_FOUND", "notification was not found.");
    return this.prisma.notification.findUniqueOrThrow({ where: { id } });
  }

  markAllRead(recipientUserId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientUserId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
