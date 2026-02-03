import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth-middleware";
import { aiMatchUsers } from "@/lib/ai";

type Variables = {
  userId: string;
};

const matchesApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  .post("/:communityId/aimatch", async (c) => {
    const user = c.get("user");
    const communityId = c.req.param("communityId");

    const aiMatch = await aiMatchUsers(user, communityId);
    return c.json(aiMatch);
  });

export { matchesApp };
