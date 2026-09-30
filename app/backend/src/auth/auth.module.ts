import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { SERVICE_CONFIG, ServiceConfig } from "../common/config";
import { UsersModule } from "../users/users.module";
import { EndedSessions } from "./ended-sessions";
import { IdentityGuard } from "./identity.guard";
import { SessionsController } from "./sessions.controller";
import { RealmTokenVerifier, TOKEN_VERIFIER } from "./token-verifier";

/**
 * Who is asking, on every route: the bearer token checked against the realm, and the
 * account it signs in as loaded from the service's own data (decision records 0001, 0004).
 */
@Module({
  imports: [UsersModule],
  controllers: [SessionsController],
  providers: [
    EndedSessions,
    {
      provide: TOKEN_VERIFIER,
      inject: [SERVICE_CONFIG],
      useFactory: (config: ServiceConfig) => new RealmTokenVerifier(config.identity),
    },
    { provide: APP_GUARD, useClass: IdentityGuard },
  ],
})
export class AuthModule {}
