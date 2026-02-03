import { OpenRouter } from "@openrouter/sdk";
import {
  createMatch,
  getGoalsByUserAndCommunity,
  getGoalsByUsersAndCommunity,
  getMembersInCommunity,
  getPartnerUserId,
  getUserMatchesInCommunity,
} from "./db-helpers";
import { getOrCreateUserByClerkId } from "./user-utils";
import { learningGoals } from "@/db/schema";

// Initialize OpenRouter client
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const aiMatchUsers = async (
  user: NonNullable<Awaited<ReturnType<typeof getOrCreateUserByClerkId>>>,
  communityId: string,
) => {
  try {
    const currentUserGoals = await getGoalsByUserAndCommunity(
      user.id,
      communityId,
    );
    const members = await getMembersInCommunity(communityId, user.id);

    const existingMatches = await getUserMatchesInCommunity(
      user.id,
      communityId,
    );

    const existingMatchUserIds = new Set(
      existingMatches.map((m) => getPartnerUserId(m, user.id)),
    );

    const potentialMemberIds = members
      .filter((m) => !existingMatchUserIds.has(m.user.id))
      .map((m) => m.user.id);

    const goalsMap = await getGoalsByUsersAndCommunity(
      potentialMemberIds,
      communityId,
    );

    const potentialPartners = [];
    const memberWithoutGoals = [];

    for (const member of members) {
      if (existingMatchUserIds.has(member.user.id)) continue;

      const memberGoals = goalsMap.get(member.user.id) || [];

      if (memberGoals.length > 0) {
        potentialPartners.push({
          userId: member.user.id,
          username: member.user.name,
          goals: memberGoals.map((g: typeof learningGoals.$inferSelect) => ({
            title: g.title,
            description: g.description || "",
          })),
        });
      } else {
        memberWithoutGoals.push(member.user.name);
      }
    }

    console.log("Current user goals:", currentUserGoals);
    console.log("Total members:", members.length);
    console.log("Potential partners:", potentialPartners.length);
    console.log("Members without goals:", memberWithoutGoals);

    if (potentialPartners.length === 0) {
      return {
        matched: 0,
        matches: [],
        message: "No potential partners found with learning goals",
      };
    }

    // Build the prompt
    const prompt = `You are an AI matching assistant for a learning platform. Your job is to match learners with compatible learning partners.

Current User: ${user.name}
Their Learning Goals:
${currentUserGoals.map((g) => `- ${g.title}: ${g.description}`).join("\n")}

Potential Partners:
${potentialPartners
  .map(
    (p, idx) => `
${idx + 1}. ${p.username}
   Goals:
   ${p.goals
     .map(
       (g: typeof learningGoals.$inferSelect) =>
         `   - ${g.title}: ${g.description}`,
     )
     .join("\n")}
`,
  )
  .join("\n")}

Task: Analyze the learning goals and identify the TOP 3 most compatible learning partners for ${
      user.name
    }.

IMPORTANT MATCHING CRITERIA:
1. Use SEMANTIC SIMILARITY - goals don't need exact title matches. For example:
   - "Learn the basics of React" matches with "React Hooks deep dive" (both about React)
   - "Next.js - App Router - Build and Ship an app" matches with "Next.js App Router" (both about Next.js App Router)
   - "JavaScript fundamentals" matches with "JavaScript ES6+ features" (both about JavaScript)

2. Look at BOTH title and description to understand what the person wants to learn

3. Consider:
   - Overlapping or complementary learning goals (even if worded differently)
   - Similar skill levels or learning paths
   - Potential for mutual learning and knowledge sharing
   - Common interests and learning styles

4. Be INCLUSIVE - if there's any reasonable connection between learning goals, include them as a potential match

Return ONLY a JSON array of partner indices (1-based) in order of compatibility. Return between 1-3 matches maximum.
Example: [2, 5, 1] means partner #2 is the best match, then #5, then #1.

Only return an empty array [] if there are truly NO partners with any related learning interests.`;

    // Use OpenRouter with streaming
    const stream = await openrouter.chat.send({
      model: "moonshotai/kimi-k2.5", // atau model lain seperti "anthropic/claude-3.5-sonnet"
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    });

    // Collect the response
    let text = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        text += content;
      }

      // Optional: log usage information
      // if (chunk.usage) {
      //   console.log("Reasoning tokens:", chunk.usage.reasoningTokens);
      //   console.log("Total tokens:", chunk.usage.totalTokens);
      // }
    }

    console.log("Raw AI response:", text);

    // Clean up the response
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
    }

    console.log("Cleaned AI response:", jsonText);

    let matchIndices = [];

    try {
      matchIndices = JSON.parse(jsonText);
      if (!Array.isArray(matchIndices)) {
        console.warn("Invalid JSON format returned by AI");
        matchIndices = [];
      }
    } catch (error) {
      console.warn("Invalid JSON format returned by AI", error);
      const arrayMatch = jsonText.match(/\[[\d,\s]+\]/);
      if (arrayMatch) {
        matchIndices = JSON.parse(arrayMatch[0]);
        console.log("Extracted array from response:", matchIndices);
      } else {
        console.warn("No valid match indices found in AI response");
        throw new Error("AI returned invalid response");
      }
    }

    // Create match records in the database
    const createdMatches = [];

    for (const idx of matchIndices) {
      const partnerIndex = idx - 1;
      if (partnerIndex >= 0 && partnerIndex < potentialPartners.length) {
        const partner = potentialPartners[partnerIndex];
        const match = await createMatch(user.id, partner.userId, communityId);
        createdMatches.push({
          ...match,
          partnerName: partner.username,
        });
      }
    }

    console.log("Created matches:", createdMatches, createdMatches.length);

    return {
      matched: createdMatches.length,
      matches: createdMatches,
    };
  } catch (error) {
    console.error("Error matching users", error);
    return {
      matched: 0,
      matches: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const generateAISummaries = () => {};
