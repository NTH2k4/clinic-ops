import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { successEnvelope } from "../common/api-response";
import { parseSchema } from "../common/validation";
import { changePasswordSchema, patientRegistrationSchema, updateAccountProfileSchema } from "./auth.dto";
import { AuthService } from "./auth.service";
import { type AuthenticatedRequest, extractSessionToken, SESSION_COOKIE_NAME, SessionGuard } from "./session.guard";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/v1",
  maxAge: 12 * 60 * 60 * 1000,
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: LoginBody, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(
      typeof body.email === "string" ? body.email : "",
      typeof body.password === "string" ? body.password : "",
    );
    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, sessionCookieOptions);
    return successEnvelope(result);
  }

  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.registerPatient(parseSchema(patientRegistrationSchema, body));
    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, sessionCookieOptions);
    return successEnvelope(result);
  }

  @Post("change-password")
  @UseGuards(SessionGuard)
  async changePassword(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    await this.authService.changePassword(request.currentUser.id, parseSchema(changePasswordSchema, body));
    return successEnvelope({});
  }

  @Patch("profile")
  @UseGuards(SessionGuard)
  async updateProfile(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return successEnvelope(await this.authService.updateAccountProfile(request.currentUser.id, parseSchema(updateAccountProfileSchema, body)));
  }

  @Post("logout")
  @UseGuards(SessionGuard)
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const sessionToken = extractSessionToken(request);
    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }
    response.clearCookie(SESSION_COOKIE_NAME, { path: sessionCookieOptions.path });
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
