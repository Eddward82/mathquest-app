import { parseStreamedText } from "../explanationParser";

const GENERIC_FIRST_TITLE = "Read carefully";

describe("parseStreamedText", () => {
  it("parses the canonical format", () => {
    const text = [
      "EMOJI: ➗",
      "STEP 1: Convert | Divide 15 by 100 to get 0.15.",
      "STEP 2: Multiply | 0.15 × 80 = 12.",
      "TIP: Percent means per hundred.",
    ].join("\n");

    const result = parseStreamedText(text);
    expect(result.emoji).toBe("➗");
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].title).toBe("Convert");
    expect(result.steps[1].body).toBe("0.15 × 80 = 12.");
    expect(result.tip).toBe("Percent means per hundred.");
  });

  it("accepts lowercase and dash-separated step markers", () => {
    const text = ["Step 1 - Add the numbers | 7 + 7 = 14.", "step 2: Double it | 14 × 2 = 28."].join("\n");
    const result = parseStreamedText(text);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].body).toBe("7 + 7 = 14.");
  });

  it("accepts plain numbered lists", () => {
    const text = ["1. First, write 3/4 as 0.75.", "2) Multiply 0.75 by 20 to get 15."].join("\n");
    const result = parseStreamedText(text);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[1].body).toContain("0.75 by 20");
  });

  it("strips markdown bold from markers and content", () => {
    const text = "**STEP 1:** **Simplify** | Divide both sides by 2.";
    const result = parseStreamedText(text);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].title).toBe("Simplify");
  });

  it("treats mangled emoji-prefixed pipe lines as steps", () => {
    // Observed live: model merged the EMOJI line into the first step
    const text = [
      "➗: Multiplication | To solve 7 x 8, add 7 together 8 times.",
      "STEP 1: Grouping | Group them as (7 + 7) × 4.",
    ].join("\n");
    const result = parseStreamedText(text);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].body).toContain("7 x 8");
  });

  it("attaches continuation lines to the previous step", () => {
    const text = [
      "STEP 1: Expand | Multiply out the brackets:",
      "2(x + 3) = 2x + 6.",
      "STEP 2: Solve | Subtract 6 from both sides.",
    ].join("\n");
    const result = parseStreamedText(text);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].body).toBe("Multiply out the brackets: 2(x + 3) = 2x + 6.");
  });

  it("shows unstructured real answers as a single card instead of generic steps", () => {
    const text =
      "To find 15% of 80, convert 15% to the decimal 0.15 and multiply: 0.15 × 80 = 12. So the answer is 12.";
    const result = parseStreamedText(text);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].body).toContain("0.15 × 80 = 12");
    expect(result.steps[0].title).not.toBe(GENERIC_FIRST_TITLE);
  });

  it("falls back to the generic explanation only for unusably short text", () => {
    const result = parseStreamedText("ok");
    expect(result.steps[0].title).toBe(GENERIC_FIRST_TITLE);
  });
});
