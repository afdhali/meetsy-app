import { db } from "@/db";
import { communities, communityMembers } from "@/db/schema";
import { getOrCreateUserByClerkId } from "@/lib/user-utils";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

type Variables = {
  userId: string;
};

const communitiesApp = new Hono<{ Variables: Variables }>()
  .get("/all", async (c) => {
    const allCommunities = await db.select().from(communities);
    return c.json(allCommunities);
  })
  .get("/", async (c) => {
    const clerkId = c.get("userId");
    console.log("clerkId", clerkId);
    const user = await getOrCreateUserByClerkId(clerkId);
    console.log("user", user);
    if (!user) {
      return c.json([]);
    }

    const userCommunities = await db
      .select({
        id: communityMembers.id,
        userId: communityMembers.userId,
        communityId: communityMembers.communityId,
        joinedAt: communityMembers.joinedAt,
        community: communities,
      })
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, user.id));

    return c.json(userCommunities);
  })
  .post("/:communityId/join", async (c) => {
    return c.json({ message: "Joined community successfully" });
  });

export { communitiesApp };
