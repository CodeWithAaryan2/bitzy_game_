import { describe, expect, it } from "vitest";
import { tigerAnalyticsRouter } from "./tiger-analytics-router";

describe("Tiger Cloud analytics access", () => {
  it("rejects an unauthenticated trend request before connecting to Tiger Cloud", async () => {
    const caller = tigerAnalyticsRouter.createCaller({
      req: new Request("http://localhost/api/trpc"),
      resHeaders: new Headers(),
    });
    await expect(caller.performanceTrend({ gameId: "all", days: 30 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
