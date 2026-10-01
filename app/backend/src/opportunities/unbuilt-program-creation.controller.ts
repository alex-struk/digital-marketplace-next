import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  NotImplementedException,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { IdentifiedRequest } from "../auth/bearer-token";
import {
  NOT_PERMITTED_TO_CREATE,
  ONLY_ADMINISTRATORS_PUBLISH,
  OpportunityViewer,
  mayCreateInState,
  mayCreateOpportunity,
} from "../rules/opportunities";
import { OPPORTUNITY_VIEWERS, OpportunityViewers } from "./cwu-opportunities.controller";

const CREATABLE = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"] as const;

export const NOT_YET_OFFERED =
  "Sprint With Us and Team With Us opportunities cannot be created in this version of the service yet.";

/**
 * R-1.48 holds in all three programs: creating an opportunity as published is refused unless the
 * requester is an administrator. The Sprint With Us and Team With Us opportunities themselves
 * are slice 10's, so until then their create addresses apply only who may create and in what
 * state, and answer anything permitted with "not yet offered" (decision record 0030). Slice 10
 * replaces this controller with the programs' own.
 */
export function refuseCreation(viewer: OpportunityViewer | null, body: unknown): never {
  if (!viewer || !mayCreateOpportunity(viewer)) throw new UnauthorizedException(NOT_PERMITTED_TO_CREATE);
  const requested = (body as { status?: unknown } | null)?.status ?? "DRAFT";
  if (!CREATABLE.includes(requested as (typeof CREATABLE)[number])) {
    throw new BadRequestException([
      "status: An opportunity is created as a draft (DRAFT), under review (UNDER_REVIEW) or published (PUBLISHED).",
    ]);
  }
  if (!mayCreateInState(viewer, requested as (typeof CREATABLE)[number])) {
    throw new UnauthorizedException(ONLY_ADMINISTRATORS_PUBLISH);
  }
  throw new NotImplementedException(NOT_YET_OFFERED);
}

@Controller("api/opportunities")
export class UnbuiltProgramCreationController {
  constructor(@Inject(OPPORTUNITY_VIEWERS) private readonly viewers: OpportunityViewers) {}

  @Post("sprint-with-us")
  @HttpCode(201)
  async createSprintWithUs(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<never> {
    return refuseCreation(await this.viewers.readingAccount(request.identity), body);
  }

  @Post("team-with-us")
  @HttpCode(201)
  async createTeamWithUs(@Body() body: unknown, @Req() request: IdentifiedRequest): Promise<never> {
    return refuseCreation(await this.viewers.readingAccount(request.identity), body);
  }
}
