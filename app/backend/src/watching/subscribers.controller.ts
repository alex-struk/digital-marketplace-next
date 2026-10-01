import { Body, Controller, Delete, HttpCode, Inject, Param, Post, Req } from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "../opportunities/cwu-opportunities.controller";
import { Program } from "../rules/opportunities";
import { WatchAnswer } from "./watching";
import { WatchingService } from "./watching.service";

interface Subscription {
  readonly opportunity?: unknown;
}

/**
 * `/api/subscribers/<program>`: watching an opportunity, and `/api/subscribers/<program>/<id>`,
 * where the identifier is the opportunity's, no longer watching it (R-1.5; decision record 0034).
 */
@Controller("api/subscribers")
export class SubscribersController {
  constructor(
    private readonly watching: WatchingService,
    @Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers,
  ) {}

  @Post("code-with-us")
  @HttpCode(201)
  watchCodeWithUs(@Body() body: Subscription, @Req() request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.watch("code-with-us", body, request);
  }

  @Post("sprint-with-us")
  @HttpCode(201)
  watchSprintWithUs(@Body() body: Subscription, @Req() request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.watch("sprint-with-us", body, request);
  }

  @Post("team-with-us")
  @HttpCode(201)
  watchTeamWithUs(@Body() body: Subscription, @Req() request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.watch("team-with-us", body, request);
  }

  @Delete("code-with-us/:id")
  unwatchCodeWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.unwatch("code-with-us", id, request);
  }

  @Delete("sprint-with-us/:id")
  unwatchSprintWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.unwatch("sprint-with-us", id, request);
  }

  @Delete("team-with-us/:id")
  unwatchTeamWithUs(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.unwatch("team-with-us", id, request);
  }

  private async watch(program: Program, body: Subscription, request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.watching.watch(await this.viewers.readingAccount(request.identity), program, body?.opportunity);
  }

  private async unwatch(program: Program, id: string, request: IdentifiedRequest): Promise<WatchAnswer> {
    return this.watching.unwatch(await this.viewers.readingAccount(request.identity), program, id);
  }
}
