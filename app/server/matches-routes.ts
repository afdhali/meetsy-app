/* eslint-disable @typescript-eslint/no-unused-vars */
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth-middleware";

type Variables = {
  userId: string;
};

const matchesApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  .post("/", async (c) => {
    const user = c.get("user");
  });

export { matchesApp };
