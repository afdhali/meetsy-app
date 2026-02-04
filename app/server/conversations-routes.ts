import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth-middleware";
import z from "zod";
import { zValidator } from "@hono/zod-validator";

type Variables = {
  userId: string;
};

const createMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

const conversationsApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  .get("/:conversationId/messages", async (c) => {
    const conversationId = c.req.param("conversationId");

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    return c.json(conversationMessages);
  })
  .post(
    "/:conversationId/messages",
    zValidator("json", createMessageSchema), // ← Tambahkan validator
    async (c) => {
      const conversationId = c.req.param("conversationId");
      const user = c.get("user");

      // TypeScript sekarang tahu tipe data yang valid!
      const { content } = c.req.valid("json");

      const [message] = await db
        .insert(messages)
        .values({
          conversationId,
          content,
          senderId: user.id,
        })
        .returning();

      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));

      return c.json(message);
    },
  );

export { conversationsApp };
