import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth-middleware";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { messages, conversations } from "@/db/schema";

type Variables = {
  userId: string;
};

const conversationsApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  .get("/:conversationId/messages", async (c) => {
    const conversationId = c.req.param("conversationId");

    const messagesData = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return c.json(messagesData);
  })
  .get("/by-match/:matchId", async (c) => {
    const matchId = c.req.param("matchId");

    // Find conversation by match ID
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.matchId, matchId));

    return c.json(conversation);
  });

export { conversationsApp };
