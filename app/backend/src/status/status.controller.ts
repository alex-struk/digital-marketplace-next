import { Controller, Get, Header } from "@nestjs/common";

@Controller("status")
export class StatusController {
  /**
   * Reports that the service is up. Needs no session and changes nothing else, which is why
   * it is also the address named as the trigger for the transitions that look time-driven
   * (decision record 0005): the deadline hook in `application.ts` runs in front of it.
   */
  @Get()
  @Header("content-type", "text/plain; charset=utf-8")
  read(): string {
    return "OK";
  }
}
