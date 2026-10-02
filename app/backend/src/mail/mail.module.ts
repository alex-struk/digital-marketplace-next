import { Global, Logger, Module } from "@nestjs/common";
import { MAIL_SETTINGS, MAIL_TRANSPORT, MailLog, Mailer, MailTransport } from "./mailer";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaRecipientStanding } from "./prisma-recipient-standing";
import { MailSettings, mailSettingsFrom } from "./settings";
import { SmtpTransport } from "./smtp.transport";

const logger = new Logger("mail");

/** The operational log's view of the mail path: what kind of message, and what happened. */
const mailLog: MailLog = (entry) => {
  const line = JSON.stringify(entry);
  if (entry.level === "error") logger.error(line);
  else logger.log(line);
};

/**
 * The mail path every notice goes through. Its settings are read once, when the service
 * starts, and a sender that is not "Display name <address>" stops it starting (R-6.4).
 */
@Global()
@Module({
  providers: [
    { provide: MAIL_SETTINGS, useFactory: () => mailSettingsFrom(process.env) },
    {
      provide: MAIL_TRANSPORT,
      inject: [MAIL_SETTINGS],
      useFactory: (settings: MailSettings) => new SmtpTransport(settings),
    },
    {
      provide: Mailer,
      inject: [MAIL_SETTINGS, MAIL_TRANSPORT, PrismaService],
      useFactory: (settings: MailSettings, transport: MailTransport, prisma: PrismaService) =>
        new Mailer(settings, transport, mailLog, new PrismaRecipientStanding(prisma)),
    },
  ],
  exports: [MAIL_SETTINGS, Mailer],
})
export class MailModule {}
