import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { corsOriginsFromEnv, portFromEnv } from "./config/runtime-config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = corsOriginsFromEnv(process.env);
  app.setGlobalPrefix("api/v1");
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins });
  }
  await app.listen(portFromEnv(process.env));
}

void bootstrap();
