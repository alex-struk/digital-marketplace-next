import { Controller, Get, Inject, Param, Put, Query, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "../opportunities/cwu-opportunities.controller";
import { Counts } from "./counters";
import { CountersService } from "./counters.service";

/**
 * The names asked for: `?counters=a&counters=b`, or one value naming several separated by commas,
 * as the old application's client wrote them.
 */
export function counterNamesFrom(query: unknown): string[] {
  const values = Array.isArray(query) ? query : query === undefined ? [] : [query];
  return values
    .flatMap((value) => String(value).split(","))
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/** `/api/counters`: reading counts by name, and adding a view (decision record 0034). */
@Controller("api/counters")
export class CountersController {
  constructor(
    private readonly counters: CountersService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Get()
  async read(@Query("counters") counters: unknown, @Req() request: IdentifiedRequest): Promise<Counts> {
    return this.counters.read(await this.viewers.readingAccount(request.identity), counterNamesFrom(counters));
  }

  @Put(":id")
  async increment(@Param("id") name: string, @Req() request: IdentifiedRequest): Promise<Counts> {
    return this.counters.increment(await this.viewers.readingAccount(request.identity), name);
  }
}
