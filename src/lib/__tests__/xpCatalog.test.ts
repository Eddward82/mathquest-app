import catalog from "../../../server/xpCatalog.json";
import { TOPICS } from "../../data/lessons";
import { CHALLENGES } from "../../data/dailyChallenges";
import { REVIEW_XP_REWARD, TOPIC_REVIEWS } from "../../data/topicReviews";

// The server limits leaderboard XP using this catalog, so a lesson it doesn't
// know about would earn nothing. If this fails, regenerate it:
//   cd server && npx ts-node --transpile-only scripts/generate-xp-catalog.ts
describe("server/xpCatalog.json matches the app's data", () => {
  it("has every lesson at its real XP", () => {
    const lessons = Object.fromEntries(
      TOPICS.flatMap((topic) => topic.lessons).map((lesson) => [lesson.id, lesson.xp_reward])
    );
    expect(catalog.lessons).toEqual(lessons);
  });

  it("has every review topic and the review reward", () => {
    expect(catalog.reviewTopics).toEqual(Object.keys(TOPIC_REVIEWS));
    expect(catalog.reviewXp).toBe(REVIEW_XP_REWARD);
  });

  it("has the largest daily challenge reward", () => {
    expect(catalog.dailyChallengeMaxXp).toBe(Math.max(...CHALLENGES.map((c) => c.xpReward)));
  });
});
