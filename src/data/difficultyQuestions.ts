import { LessonStep } from "../types";

// Extra intermediate and advanced steps per lesson.
// These are merged into the lesson at runtime by getLessonById.
// Beginner steps live directly in lessons.ts (no difficulty tag).

const EXTRA_STEPS: Record<string, LessonStep[]> = {

  // ─── ARITHMETIC ─────────────────────────────────────────────────────────────

  lesson_arith_3: [
    {
      id: "step_a3_int_1", lesson_id: "lesson_arith_3", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "A bag of 336 sweets is shared equally among 14 children. How many each?",
        before_blank: "Each child gets", after_blank: "sweets",
        correct_answer: "24",
        explanation: "336 ÷ 14 = 24.",
      },
    },
    {
      id: "step_a3_adv_1", lesson_id: "lesson_arith_3", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "1,248 chairs are arranged in rows of 32. How many rows?",
        options: ["37", "38", "39", "40"],
        correct_index: 2,
        explanation: "1248 ÷ 32 = 39.",
      },
    },
  ],

  lesson_arith_4: [
    {
      id: "step_a4_int_1", lesson_id: "lesson_arith_4", type: "multiple_choice",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "What is −15 + (−8) − (−3)?",
        options: ["−20", "−26", "−10", "−4"],
        correct_index: 0,
        explanation: "−15 + (−8) − (−3) = −15 − 8 + 3 = −20.",
      },
    },
    {
      id: "step_a4_adv_1", lesson_id: "lesson_arith_4", type: "fill_blank",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "The temperature drops from 7°C to −13°C. What is the total drop?",
        before_blank: "Temperature drop =", after_blank: "°C",
        correct_answer: "20",
        explanation: "7 − (−13) = 7 + 13 = 20°C drop.",
      },
    },
  ],

  lesson_arith_5: [
    {
      id: "step_a5_int_1", lesson_id: "lesson_arith_5", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "What is 952 ÷ 28?",
        before_blank: "952 ÷ 28 =", after_blank: "",
        correct_answer: "34",
        explanation: "952 ÷ 28 = 34. Check: 34 × 28 = 952 ✓.",
      },
    },
    {
      id: "step_a5_adv_1", lesson_id: "lesson_arith_5", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "4,896 items are packed into boxes of 48. How many boxes?",
        options: ["100", "102", "104", "108"],
        correct_index: 1,
        explanation: "4896 ÷ 48 = 102.",
      },
    },
  ],

  // ─── ALGEBRA ────────────────────────────────────────────────────────────────

  lesson_alg_1: [
    {
      id: "step_alg1_int_1", lesson_id: "lesson_alg_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Simplify: 4x + 3y − x + 2y",
        before_blank: "Answer =", after_blank: "(write like 3x+5y)",
        correct_answer: "3x+5y",
        explanation: "Collect like terms: (4x−x) + (3y+2y) = 3x + 5y.",
      },
    },
    {
      id: "step_alg1_adv_1", lesson_id: "lesson_alg_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Expand and simplify: 3(2x − 4) + 2(x + 5)",
        options: ["8x − 2", "8x + 2", "6x − 2", "8x − 22"],
        correct_index: 0,
        explanation: "3(2x−4) = 6x−12. 2(x+5) = 2x+10. Sum = 8x − 2.",
      },
    },
  ],

  lesson_alg_2: [
    {
      id: "step_alg2_int_1", lesson_id: "lesson_alg_2", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Solve: 5x − 8 = 3x + 6",
        before_blank: "x =", after_blank: "",
        correct_answer: "7",
        explanation: "5x − 3x = 6 + 8 → 2x = 14 → x = 7.",
      },
    },
    {
      id: "step_alg2_adv_1", lesson_id: "lesson_alg_2", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Solve: 3(x + 4) = 2(x + 9)",
        options: ["x = 4", "x = 5", "x = 6", "x = 8"],
        correct_index: 2,
        explanation: "3x+12 = 2x+18 → x = 6.",
      },
    },
  ],

  lesson_alg_3: [
    {
      id: "step_alg3_int_1", lesson_id: "lesson_alg_3", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Find the gradient of the line joining (2,5) and (6,13).",
        before_blank: "Gradient =", after_blank: "",
        correct_answer: "2",
        explanation: "Gradient = (13−5)÷(6−2) = 8÷4 = 2.",
      },
    },
    {
      id: "step_alg3_adv_1", lesson_id: "lesson_alg_3", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Find the equation of a line with gradient 3 passing through (1, 4).",
        options: ["y = 3x + 1", "y = 3x − 1", "y = 3x + 4", "y = x + 3"],
        correct_index: 0,
        explanation: "y − 4 = 3(x − 1) → y = 3x + 1.",
      },
    },
  ],

  // ─── GEOMETRY ───────────────────────────────────────────────────────────────

  lesson_geo_1: [
    {
      id: "step_geo1_int_1", lesson_id: "lesson_geo_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "A quadrilateral has angles 95°, 110°, 85°, and x°. Find x.",
        before_blank: "x =", after_blank: "°",
        correct_answer: "70",
        explanation: "Angles in a quadrilateral sum to 360°. x = 360 − 95 − 110 − 85 = 70°.",
      },
    },
    {
      id: "step_geo1_adv_1", lesson_id: "lesson_geo_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Two parallel lines are cut by a transversal. One co-interior angle is 112°. What is the other?",
        options: ["68°", "112°", "58°", "72°"],
        correct_index: 0,
        explanation: "Co-interior angles sum to 180°. 180 − 112 = 68°.",
      },
    },
  ],

  lesson_geo_2: [
    {
      id: "step_geo2_int_1", lesson_id: "lesson_geo_2", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "An isosceles triangle has a base angle of 52°. What is the apex angle?",
        before_blank: "Apex angle =", after_blank: "°",
        correct_answer: "76",
        explanation: "Base angles are equal: 52+52=104. Apex = 180−104 = 76°.",
      },
    },
    {
      id: "step_geo2_adv_1", lesson_id: "lesson_geo_2", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "In a right triangle, one angle is 37°. What is the third angle?",
        options: ["37°", "53°", "63°", "90°"],
        correct_index: 1,
        explanation: "Angles sum to 180°. 90 + 37 + x = 180 → x = 53°.",
      },
    },
  ],

  // ─── FRACTIONS ──────────────────────────────────────────────────────────────

  lesson_frac_1: [
    {
      id: "step_frac1_int_1", lesson_id: "lesson_frac_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Simplify 48/72.",
        before_blank: "48/72 =", after_blank: "(simplest form)",
        correct_answer: "2/3",
        explanation: "HCF(48,72) = 24. 48÷24=2, 72÷24=3. Answer: 2/3.",
      },
    },
    {
      id: "step_frac1_adv_1", lesson_id: "lesson_frac_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Which fraction is equivalent to 5/8?",
        options: ["15/32", "20/32", "25/40", "10/20"],
        correct_index: 1,
        explanation: "5/8 = 20/32 (multiply both by 4).",
      },
    },
  ],

  lesson_frac_2: [
    {
      id: "step_frac2_int_1", lesson_id: "lesson_frac_2", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Calculate 3/4 + 5/6.",
        before_blank: "Answer =", after_blank: "(as a mixed number e.g. 1 1/2)",
        correct_answer: "1 7/12",
        explanation: "LCM=12. 9/12 + 10/12 = 19/12 = 1 7/12.",
      },
    },
    {
      id: "step_frac2_adv_1", lesson_id: "lesson_frac_2", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "What is 2⅓ − 1¾?",
        options: ["½", "7/12", "5/12", "1/12"],
        correct_index: 1,
        explanation: "2⅓=7/3=28/12. 1¾=7/4=21/12. 28/12−21/12=7/12.",
      },
    },
  ],

  // ─── PERCENTAGES ────────────────────────────────────────────────────────────

  lesson_pct_1: [
    {
      id: "step_pct1_int_1", lesson_id: "lesson_pct_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "What percentage of 360 is 54?",
        before_blank: "Answer =", after_blank: "%",
        correct_answer: "15",
        explanation: "(54÷360)×100 = 0.15×100 = 15%.",
      },
    },
    {
      id: "step_pct1_adv_1", lesson_id: "lesson_pct_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "A value increases from £240 to £300. What is the percentage increase?",
        options: ["20%", "25%", "60%", "30%"],
        correct_index: 1,
        explanation: "Change = 60. % increase = (60÷240)×100 = 25%.",
      },
    },
  ],

  // ─── NUMBER THEORY ──────────────────────────────────────────────────────────

  lesson_nt_1: [
    {
      id: "step_nt1_int_1", lesson_id: "lesson_nt_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Find the LCM of 12, 15 and 20.",
        before_blank: "LCM =", after_blank: "",
        correct_answer: "60",
        explanation: "12=2²×3, 15=3×5, 20=2²×5. LCM=2²×3×5=60.",
      },
    },
    {
      id: "step_nt1_adv_1", lesson_id: "lesson_nt_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Two buses leave a stop every 12 and 18 minutes. How long until they leave together again?",
        options: ["24 min", "30 min", "36 min", "54 min"],
        correct_index: 2,
        explanation: "LCM(12,18) = 36 minutes.",
      },
    },
  ],

  lesson_nt_2: [
    {
      id: "step_nt2_int_1", lesson_id: "lesson_nt_2", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Write 84 as a product of prime factors.",
        before_blank: "84 =", after_blank: "(e.g. 2^2×3×5)",
        correct_answer: "2^2×3×7",
        explanation: "84 = 4×21 = 2²×3×7.",
      },
    },
    {
      id: "step_nt2_adv_1", lesson_id: "lesson_nt_2", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Using prime factorisation, find HCF(180, 252).",
        options: ["18", "36", "12", "9"],
        correct_index: 1,
        explanation: "180=2²×3²×5. 252=2²×3²×7. HCF=2²×3²=36.",
      },
    },
  ],

  // ─── STATISTICS ─────────────────────────────────────────────────────────────

  lesson_stat_1: [
    {
      id: "step_stat1_int_1", lesson_id: "lesson_stat_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "Data: 3, 7, 7, 8, 10, 12, 12. What is the mode?",
        before_blank: "Mode =", after_blank: "(list all modes separated by comma if more than one)",
        correct_answer: "7, 12",
        explanation: "Both 7 and 12 appear twice — the data is bimodal.",
      },
    },
    {
      id: "step_stat1_adv_1", lesson_id: "lesson_stat_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "6 students scored: 72, 85, 68, 91, 74, x. The mean is 78. What is x?",
        options: ["74", "78", "80", "82"],
        correct_index: 1,
        explanation: "Sum = 78×6 = 468. Known sum = 72+85+68+91+74 = 390. x = 468−390 = 78.",
      },
    },
  ],

  // ─── PROBABILITY ────────────────────────────────────────────────────────────

  lesson_prob_1: [
    {
      id: "step_prob1_int_1", lesson_id: "lesson_prob_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "A bag has 4 red, 3 blue, 2 green balls. P(not red) = ?",
        before_blank: "P(not red) =", after_blank: "(as a fraction)",
        correct_answer: "5/9",
        explanation: "Total = 9. Not red = 3+2 = 5. P(not red) = 5/9.",
      },
    },
    {
      id: "step_prob1_adv_1", lesson_id: "lesson_prob_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "P(A) = 0.3, P(B) = 0.5, A and B are mutually exclusive. What is P(A or B)?",
        options: ["0.15", "0.35", "0.8", "0.2"],
        correct_index: 2,
        explanation: "Mutually exclusive: P(A or B) = P(A) + P(B) = 0.3 + 0.5 = 0.8.",
      },
    },
  ],

  // ─── MEASUREMENT ────────────────────────────────────────────────────────────

  lesson_meas_1: [
    {
      id: "step_meas1_int_1", lesson_id: "lesson_meas_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "A trapezium has parallel sides 8cm and 12cm, height 5cm. What is its area?",
        before_blank: "Area =", after_blank: "cm²",
        correct_answer: "50",
        explanation: "Area = ½ × (a+b) × h = ½ × (8+12) × 5 = ½ × 100 = 50cm².",
      },
    },
    {
      id: "step_meas1_adv_1", lesson_id: "lesson_meas_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "A composite shape is a rectangle 10×6 with a semicircle of diameter 6 on top. What is the total area? (π≈3.14)",
        options: ["74.13cm²", "88.26cm²", "60cm²", "81.54cm²"],
        correct_index: 0,
        explanation: "Rectangle = 60cm². Semicircle = ½×π×3² = ½×3.14×9 = 14.13cm². Total = 74.13cm².",
      },
    },
  ],

  lesson_meas_2: [
    {
      id: "step_meas2_int_1", lesson_id: "lesson_meas_2", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "A cylinder has radius 4cm and height 10cm. What is its volume? (π≈3.14)",
        before_blank: "Volume =", after_blank: "cm³",
        correct_answer: "502.4",
        explanation: "V = π×r²×h = 3.14×16×10 = 502.4cm³.",
      },
    },
    {
      id: "step_meas2_adv_1", lesson_id: "lesson_meas_2", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "A cone has radius 6cm and height 8cm. Volume = ⅓πr²h. What is its volume? (π≈3.14)",
        options: ["301.4cm³", "301.4cm²", "904.3cm³", "100.5cm³"],
        correct_index: 0,
        explanation: "V = ⅓×3.14×36×8 = ⅓×904.32 = 301.4cm³.",
      },
    },
  ],

  // ─── WORD PROBLEMS ──────────────────────────────────────────────────────────

  lesson_wp_1: [
    {
      id: "step_wp1_int_1", lesson_id: "lesson_wp_1", type: "fill_blank",
      order_index: 10, difficulty: "intermediate",
      content: {
        question: "A plumber charges £45 call-out + £30 per hour. A job costs £165. How many hours?",
        before_blank: "Hours =", after_blank: "",
        correct_answer: "4",
        explanation: "165 − 45 = 120. 120 ÷ 30 = 4 hours.",
      },
    },
    {
      id: "step_wp1_adv_1", lesson_id: "lesson_wp_1", type: "multiple_choice",
      order_index: 11, difficulty: "advanced",
      content: {
        question: "Three friends split a bill. Alice pays twice as much as Bob. Carol pays £5 less than Bob. Total = £75. How much does Bob pay?",
        options: ["£16", "£20", "£25", "£30"],
        correct_index: 1,
        explanation: "Let Bob = b. Alice = 2b, Carol = b−5. 2b+b+(b−5)=75 → 4b=80 → b=£20.",
      },
    },
  ],
};

export function getExtraSteps(lessonId: string): LessonStep[] {
  return EXTRA_STEPS[lessonId] ?? [];
}
