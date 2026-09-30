import { Global, Logger, Module } from "@nestjs/common";
import { SERVICE_CONFIG, ServiceConfig } from "../common/config";
import { MAILER, Mailer } from "./mailer";
import { SmtpTransport } from "./smtp-transport";

/** The one mail path, for every slice's messages. */
@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      inject: [SERVICE_CONFIG],
      useFactory: (config: ServiceConfig) => {
        const logger = new Logger("mail");
        return new Mailer(config.mail, config.publicOrigin, new SmtpTransport(config.mail.smtp), {
          failed: (event, detail) => logger.error(`${event}: ${detail}`),
        });
      },
    },
  ],
  exports: [MAILER],
})
export class MailModule {}
