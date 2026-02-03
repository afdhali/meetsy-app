import { db } from "@/db";
import { communityMembers, learningGoals, matches, users } from "@/db/schema";
import { eq, and, sql, inArray, ne } from "drizzle-orm";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCommunityMembers = async (communityId: string) => {};

export const getGoalsByUserAndCommunity = async (
  userId: string,
  communityId: string,
) => {
  const currentUserLearningGoals = await db
    .select()
    .from(learningGoals)
    .where(
      and(
        eq(learningGoals.userId, userId),
        eq(learningGoals.communityId, communityId),
      ),
    );

  return currentUserLearningGoals;
};

export const getMembersInCommunity = async (
  communityId: string,
  excludeUserId?: string,
) => {
  const conditions = [eq(communityMembers.communityId, communityId)];
  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId));
  }

  return db
    .select({ member: communityMembers, user: users })
    .from(communityMembers)
    .innerJoin(users, eq(communityMembers.userId, users.id))
    .where(and(...conditions));
};

export const getUserMatchesInCommunity = async (
  userId: string,
  communityId: string,
) => {
  return db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.communityId, communityId),
        sql`${matches.user1Id} = ${userId} OR ${matches.user2Id} = ${userId}`,
      ),
    );
};

export const getPartnerUserId = (
  match: typeof matches.$inferSelect,
  userId: string,
) => {
  return match.user1Id === userId ? match.user2Id : match.user1Id;
};

export const getGoalsByUsersAndCommunity = async (
  userIds: string[],
  communityId: string,
) => {
  if (userIds.length === 0) return new Map();

  const allGoals = await db
    .select()
    .from(learningGoals)
    .where(
      and(
        inArray(learningGoals.userId, userIds),
        eq(learningGoals.communityId, communityId),
      ),
    );

  const goalsMap = new Map<string, (typeof learningGoals.$inferSelect)[]>();

  for (const goal of allGoals) {
    if (!goalsMap.has(goal.userId)) {
      goalsMap.set(goal.userId, []);
    }
    goalsMap.get(goal.userId)?.push(goal);
  }

  return goalsMap;
};

export const createMatch = async (
  user1Id: string,
  user2Id: string,
  communityId: string,
) => {
  const [match] = await db
    .insert(matches)
    .values({
      user1Id,
      user2Id,
      communityId,
      status: "pending",
    })
    .returning();

  return match;
};
