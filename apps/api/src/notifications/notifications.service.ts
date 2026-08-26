import { Injectable } from "@nestjs/common";
import { ApiError } from "../common/api-error";
import { paginationArgs, type Pagination } from "../common/validation";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(recipientUserId: string, pagination: Pagination) {
    const where = { recipientUserId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], ...paginationArgs(pagination) }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total };
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
