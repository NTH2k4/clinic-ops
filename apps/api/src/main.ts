import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import { type Request, type Response } from "express";
import { AppModule } from "./app.module";
import { corsOriginsFromEnv, portFromEnv } from "./config/runtime-config";
import { resolveWebDistPath, serveWebAppFromEnv } from "./config/static-assets";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigins = corsOriginsFromEnv(process.env);
  app.setGlobalPrefix("api/v1");
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins });
  }
  if (serveWebAppFromEnv(process.env)) {
    const webDistPath = resolveWebDistPath({ env: process.env, cwd: process.cwd(), moduleDir: __dirname });
    app.useStaticAssets(webDistPath, { index: false });
    const expressApp = app.getHttpAdapter().getInstance() as {
      get: (path: RegExp, handler: (request: Request, response: Response) => void) => void;
    };
    expressApp.get(/^\/(?!api\/v1(?:\/|$)).*/, (_request, response) => {
      response.sendFile(join(webDistPath, "index.html"));
    });
  }
  await app.listen(portFromEnv(process.env));
}

void bootstrap();
