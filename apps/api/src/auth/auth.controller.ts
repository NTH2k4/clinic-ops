import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { successEnvelope } from "../common/api-response";
import { parseSchema } from "../common/validation";
import { patientRegistrationSchema } from "./auth.dto";
import { AuthService } from "./auth.service";
import { type AuthenticatedRequest, extractBearerToken, SessionGuard } from "./session.guard";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: LoginBody) {
    const result = await this.authService.login(
      typeof body.email === "string" ? body.email : "",
      typeof body.password === "string" ? body.password : "",
    );
    return successEnvelope(result);
  }

  @Post("register")
  async register(@Body() body: unknown) {
    return successEnvelope(await this.authService.registerPatient(parseSchema(patientRegistrationSchema, body)));
  }

  @Post("logout")
  @UseGuards(SessionGuard)
  async logout(@Req() request: AuthenticatedRequest) {
    const sessionToken = extractBearerToken(request.headers.authorization);
    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }
    return successEnvelope({});
  }

  @Get("me")
  @UseGuards(SessionGuard)
  me(@Req() request: AuthenticatedRequest) {
    return successEnvelope({
      currentUser: request.currentUser,
      linkedProfile: request.linkedProfile,
    });
  }
}
