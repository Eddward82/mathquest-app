/**
 * Writes server/xpCatalog.json from the app's lesson data, so the server knows
 * what each lesson is worth without shipping the lesson content.
 *
 * Re-run after changing lessons, reviews or daily challenges (a test in
 * src/lib/__tests__/xpCatalog.test.ts fails until you do):
 *
 *   cd server && npx ts-node --transpile-only scripts/generate-xp-catalog.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { TOPICS } from "../../src/data/lessons";
import { CHALLENGES } from "../../src/data/dailyChallenges";
import { REVIEW_XP_REWARD, TOPIC_REVIEWS } from "../../src/data/topicReviews";

const catalog = {
  lessons: Object.fromEntries(
    TOPICS.flatMap((topic) => topic.lessons).map((lesson) => [lesson.id, lesson.xp_reward])
  ),
  reviewTopics: Object.keys(TOPIC_REVIEWS),
  reviewXp: REVIEW_XP_REWARD,
  dailyChallengeMaxXp: Math.max(...CHALLENGES.map((challenge) => challenge.xpReward)),
};

writeFileSync(join(__dirname, "..", "xpCatalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${Object.keys(catalog.lessons).length} lessons, ${catalog.reviewTopics.length} review topics.`);
