import { Global, Module } from "@nestjs/common";
import { ServiceSessions } from "./service-sessions";
import { SignedOutSessions } from "./signed-out-sessions";
import {
  NoRealm,
  RealmTokenVerifier,
  TOKEN_VERIFIER,
  oidcSettingsFrom,
} from "./token-verifier";

/**
 * Checking who a request comes from. The realm and client are read once at start-up; with
 * neither configured every token is refused and every request is a visitor's.
 */
@Global()
@Module({
  providers: [
    {
      provide: TOKEN_VERIFIER,
      useFactory: () => {
        const settings = oidcSettingsFrom(process.env);
        return settings ? new RealmTokenVerifier(settings) : new NoRealm();
      },
    },
    { provide: SignedOutSessions, useFactory: () => new SignedOutSessions() },
    { provide: ServiceSessions, useFactory: () => new ServiceSessions() },
  ],
  exports: [TOKEN_VERIFIER, SignedOutSessions, ServiceSessions],
})
export class AuthModule {}
