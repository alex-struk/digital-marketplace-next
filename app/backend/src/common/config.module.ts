import { Global, Module } from "@nestjs/common";
import { readConfig, SERVICE_CONFIG } from "./config";

/** The settings, read once when the service starts; a malformed one stops it starting. */
@Global()
@Module({
  providers: [{ provide: SERVICE_CONFIG, useFactory: () => readConfig() }],
  exports: [SERVICE_CONFIG],
})
export class ConfigModule {}
