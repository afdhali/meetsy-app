import { getOrCreateUserByClerkId } from "@/lib/user-utils";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth-middleware";

type AuthVariables = {
  userId: string;
  user: NonNullable<Awaited<ReturnType<typeof getOrCreateUserByClerkId>>>;
};

const usersApp = new Hono<{ Variables: AuthVariables }>()
  .use("/*", authMiddleware)
  .get("/me", async (c) => {
    const user = c.get("user");
    return c.json(user);
  });

export { usersApp };
