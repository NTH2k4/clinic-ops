import { Controller, Get } from "@nestjs/common";
import { successEnvelope } from "../common/api-response";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return successEnvelope({ status: "ok", commit: process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? "local" });
  }
}
