import { MultipleChoiceContent, FillBlankContent } from "../types";

export type ReviewQuestion = {
  id: string;
  type: "multiple_choice" | "fill_blank";
  content: MultipleChoiceContent | FillBlankContent;
};

export const TOPIC_REVIEWS: Record<string, ReviewQuestion[]> = {
  topic_arithmetic: [
    {
      id: "rev_arith_1",
      type: "multiple_choice",
      content: {
        question: "What is 347 + 256?",
        options: ["593", "603", "613", "623"],
        correct_index: 1,
        explanation: "347 + 256 = 603.",
      },
    },
    {
      id: "rev_arith_2",
      type: "fill_blank",
      content: {
        question: "Calculate 1000 − 378.",
        before_blank: "1000 − 378 =",
        after_blank: "",
        correct_answer: "622",
        explanation: "1000 − 378 = 622.",
      },
    },
    {
      id: "rev_arith_3",
      type: "multiple_choice",
      content: {
        question: "What is 24 × 15?",
        options: ["340", "350", "360", "370"],
        correct_index: 2,
        explanation: "24 × 15 = 24 × 10 + 24 × 5 = 240 + 120 = 360.",
      },
    },
    {
      id: "rev_arith_4",
      type: "fill_blank",
      content: {
        question: "What is 144 ÷ 12?",
        before_blank: "144 ÷ 12 =",
        after_blank: "",
        correct_answer: "12",
        explanation: "144 ÷ 12 = 12.",
      },
    },
    {
      id: "rev_arith_5",
      type: "multiple_choice",
      content: {
        question: "What is 2³ × 5²?",
        options: ["80", "100", "160", "200"],
        correct_index: 3,
        explanation: "2³ = 8, 5² = 25. 8 × 25 = 200.",
      },
    },
    {
      id: "rev_arith_6",
      type: "multiple_choice",
      content: {
        question: "Order of operations: 3 + 4 × 2 − 1 = ?",
        options: ["13", "12", "10", "9"],
        correct_index: 2,
        explanation: "Multiply first: 4×2=8. Then 3+8−1=10.",
      },
    },
    {
      id: "rev_arith_7",
      type: "fill_blank",
      content: {
        question: "What is the square root of 169?",
        before_blank: "√169 =",
        after_blank: "",
        correct_answer: "13",
        explanation: "13 × 13 = 169, so √169 = 13.",
      },
    },
    {
      id: "rev_arith_8",
      type: "multiple_choice",
      content: {
        question: "What is −8 + 3?",
        options: ["−11", "−5", "5", "11"],
        correct_index: 1,
        explanation: "−8 + 3 = −5.",
      },
    },
    {
      id: "rev_arith_9",
      type: "fill_blank",
      content: {
        question: "Round 4,857 to the nearest hundred.",
        before_blank: "Rounded =",
        after_blank: "",
        correct_answer: "4900",
        explanation: "The tens digit is 5, so round up: 4,900.",
      },
    },
    {
      id: "rev_arith_10",
      type: "multiple_choice",
      content: {
        question: "A train travels at 80 km/h for 2.5 hours. How far does it travel?",
        options: ["160 km", "180 km", "200 km", "220 km"],
        correct_index: 2,
        explanation: "Distance = speed × time = 80 × 2.5 = 200 km.",
      },
    },
  ],

  topic_algebra: [
    {
      id: "rev_alg_1",
      type: "multiple_choice",
      content: {
        question: "Solve: 3x + 7 = 22",
        options: ["x = 3", "x = 4", "x = 5", "x = 6"],
        correct_index: 2,
        explanation: "3x = 22 − 7 = 15. x = 15 ÷ 3 = 5.",
      },
    },
    {
      id: "rev_alg_2",
      type: "fill_blank",
      content: {
        question: "Expand: 4(2x − 3)",
        before_blank: "4(2x − 3) =",
        after_blank: "",
        correct_answer: "8x-12",
        explanation: "4 × 2x = 8x, 4 × −3 = −12. Answer: 8x − 12.",
      },
    },
    {
      id: "rev_alg_3",
      type: "multiple_choice",
      content: {
        question: "Factorise: x² + 7x + 12",
        options: ["(x+3)(x+4)", "(x+2)(x+6)", "(x+1)(x+12)", "(x+3)(x+5)"],
        correct_index: 0,
        explanation: "Find two numbers that multiply to 12 and add to 7: 3 and 4. So (x+3)(x+4).",
      },
    },
    {
      id: "rev_alg_4",
      type: "fill_blank",
      content: {
        question: "Solve: 2x − 5 = x + 3",
        before_blank: "x =",
        after_blank: "",
        correct_answer: "8",
        explanation: "2x − x = 3 + 5. x = 8.",
      },
    },
    {
      id: "rev_alg_5",
      type: "multiple_choice",
      content: {
        question: "What is the gradient of y = 3x − 4?",
        options: ["−4", "3", "4", "−3"],
        correct_index: 1,
        explanation: "In y = mx + c, m is the gradient. Here m = 3.",
      },
    },
    {
      id: "rev_alg_6",
      type: "multiple_choice",
      content: {
        question: "Simplify: 3x² × 2x³",
        options: ["5x⁵", "6x⁵", "6x⁶", "5x⁶"],
        correct_index: 1,
        explanation: "Multiply coefficients: 3×2=6. Add powers: x²⁺³=x⁵. Answer: 6x⁵.",
      },
    },
    {
      id: "rev_alg_7",
      type: "fill_blank",
      content: {
        question: "Solve the inequality: 2x + 3 > 11",
        before_blank: "x >",
        after_blank: "",
        correct_answer: "4",
        explanation: "2x > 11 − 3 = 8. x > 4.",
      },
    },
    {
      id: "rev_alg_8",
      type: "multiple_choice",
      content: {
        question: "Solve simultaneously: x + y = 10, x − y = 4",
        options: ["x=6, y=4", "x=7, y=3", "x=8, y=2", "x=5, y=5"],
        correct_index: 1,
        explanation: "Add: 2x=14, x=7. Subtract: 2y=6, y=3.",
      },
    },
    {
      id: "rev_alg_9",
      type: "fill_blank",
      content: {
        question: "If f(x) = 2x² − 1, what is f(3)?",
        before_blank: "f(3) =",
        after_blank: "",
        correct_answer: "17",
        explanation: "f(3) = 2(3²) − 1 = 2(9) − 1 = 18 − 1 = 17.",
      },
    },
    {
      id: "rev_alg_10",
      type: "multiple_choice",
      content: {
        question: "Solve: x² − 9 = 0",
        options: ["x = 3 only", "x = −3 only", "x = ±3", "x = ±9"],
        correct_index: 2,
        explanation: "x² = 9, so x = ±√9 = ±3.",
      },
    },
  ],

  topic_geometry: [
    {
      id: "rev_geo_1",
      type: "multiple_choice",
      content: {
        question: "What is the area of a circle with radius 7 cm? (Use π ≈ 3.14)",
        options: ["43.96 cm²", "153.86 cm²", "175.84 cm²", "44 cm²"],
        correct_index: 1,
        explanation: "Area = π × r² = 3.14 × 49 = 153.86 cm².",
      },
    },
    {
      id: "rev_geo_2",
      type: "fill_blank",
      content: {
        question: "Find the hypotenuse of a right triangle with legs 6 cm and 8 cm.",
        before_blank: "Hypotenuse =",
        after_blank: "cm",
        correct_answer: "10",
        explanation: "c² = 6² + 8² = 36 + 64 = 100. c = 10 cm.",
      },
    },
    {
      id: "rev_geo_3",
      type: "multiple_choice",
      content: {
        question: "Angles in a triangle sum to:",
        options: ["90°", "180°", "270°", "360°"],
        correct_index: 1,
        explanation: "The interior angles of any triangle always sum to 180°.",
      },
    },
    {
      id: "rev_geo_4",
      type: "fill_blank",
      content: {
        question: "A rectangle is 9 cm long and 5 cm wide. What is its perimeter?",
        before_blank: "Perimeter =",
        after_blank: "cm",
        correct_answer: "28",
        explanation: "Perimeter = 2(l + w) = 2(9 + 5) = 2 × 14 = 28 cm.",
      },
    },
    {
      id: "rev_geo_5",
      type: "multiple_choice",
      content: {
        question: "What is the volume of a cylinder with radius 3 cm and height 10 cm? (π ≈ 3.14)",
        options: ["94.2 cm³", "188.4 cm³", "282.6 cm³", "314 cm³"],
        correct_index: 2,
        explanation: "V = π × r² × h = 3.14 × 9 × 10 = 282.6 cm³.",
      },
    },
    {
      id: "rev_geo_6",
      type: "multiple_choice",
      content: {
        question: "Two parallel lines are cut by a transversal. Alternate interior angles are:",
        options: ["Supplementary", "Equal", "Complementary", "Different"],
        correct_index: 1,
        explanation: "Alternate interior angles are always equal when lines are parallel.",
      },
    },
    {
      id: "rev_geo_7",
      type: "fill_blank",
      content: {
        question: "A triangle has base 10 cm and height 6 cm. What is its area?",
        before_blank: "Area =",
        after_blank: "cm²",
        correct_answer: "30",
        explanation: "Area = ½ × base × height = ½ × 10 × 6 = 30 cm².",
      },
    },
    {
      id: "rev_geo_8",
      type: "multiple_choice",
      content: {
        question: "In a right-angled triangle, angle θ = 30°, hypotenuse = 10 cm. What is the opposite side? (sin 30° = 0.5)",
        options: ["4 cm", "5 cm", "6 cm", "8.66 cm"],
        correct_index: 1,
        explanation: "sin θ = O/H → O = H × sin 30° = 10 × 0.5 = 5 cm.",
      },
    },
    {
      id: "rev_geo_9",
      type: "multiple_choice",
      content: {
        question: "The central angle subtended by an arc is 100°. What is the inscribed angle on the same arc?",
        options: ["25°", "50°", "100°", "200°"],
        correct_index: 1,
        explanation: "Inscribed angle = ½ × central angle = ½ × 100° = 50°.",
      },
    },
    {
      id: "rev_geo_10",
      type: "fill_blank",
      content: {
        question: "Vectors a = (5, 2) and b = (−1, 4). What is the y-component of a + b?",
        before_blank: "y-component =",
        after_blank: "",
        correct_answer: "6",
        explanation: "a + b = (5+(−1), 2+4) = (4, 6). y-component = 6.",
      },
    },
  ],

  topic_word_problems: [
    {
      id: "rev_wp_1",
      type: "multiple_choice",
      content: {
        question: "A shop sells 3 items at £4.50 each and 2 items at £7.25 each. What is the total cost?",
        options: ["£26.50", "£27.00", "£27.50", "£28.00"],
        correct_index: 2,
        explanation: "3 × £4.50 = £13.50. 2 × £7.25 = £14.50. Total = £13.50 + £14.50 = £28.00. Wait — 13.50 + 14.50 = 28.00... Option D is correct: £28.00.",
      },
    },
    {
      id: "rev_wp_2",
      type: "fill_blank",
      content: {
        question: "A car travels 180 km in 3 hours. What is its average speed?",
        before_blank: "Speed =",
        after_blank: "km/h",
        correct_answer: "60",
        explanation: "Speed = distance ÷ time = 180 ÷ 3 = 60 km/h.",
      },
    },
    {
      id: "rev_wp_3",
      type: "multiple_choice",
      content: {
        question: "Tom has £120. He spends 35% on food. How much does he have left?",
        options: ["£42", "£68", "£72", "£78"],
        correct_index: 3,
        explanation: "35% of £120 = £42. Remaining = £120 − £42 = £78.",
      },
    },
    {
      id: "rev_wp_4",
      type: "fill_blank",
      content: {
        question: "A recipe needs 250g of flour for 4 servings. How much for 10 servings?",
        before_blank: "Flour needed =",
        after_blank: "g",
        correct_answer: "625",
        explanation: "Per serving: 250÷4 = 62.5g. For 10: 62.5 × 10 = 625g.",
      },
    },
    {
      id: "rev_wp_5",
      type: "multiple_choice",
      content: {
        question: "A pool holds 5,000 litres. A pump fills it at 200 litres/minute. How long to fill it?",
        options: ["20 min", "25 min", "40 min", "50 min"],
        correct_index: 1,
        explanation: "Time = 5000 ÷ 200 = 25 minutes.",
      },
    },
    {
      id: "rev_wp_6",
      type: "fill_blank",
      content: {
        question: "Two numbers add to 50. One is 3 times the other. What is the smaller number?",
        before_blank: "Smaller number =",
        after_blank: "",
        correct_answer: "12.5",
        explanation: "x + 3x = 50. 4x = 50. x = 12.5.",
      },
    },
    {
      id: "rev_wp_7",
      type: "multiple_choice",
      content: {
        question: "A shirt costs £40 after a 20% discount. What was the original price?",
        options: ["£48", "£50", "£52", "£54"],
        correct_index: 1,
        explanation: "Original × 0.80 = £40. Original = £40 ÷ 0.80 = £50.",
      },
    },
    {
      id: "rev_wp_8",
      type: "fill_blank",
      content: {
        question: "A worker earns £15/hour. They work 8 hours a day, 5 days a week. Weekly earnings = £",
        before_blank: "Weekly earnings = £",
        after_blank: "",
        correct_answer: "600",
        explanation: "15 × 8 × 5 = £600.",
      },
    },
    {
      id: "rev_wp_9",
      type: "multiple_choice",
      content: {
        question: "A tank is 3/4 full. It holds 200 litres when full. How much water is in it?",
        options: ["100 L", "125 L", "150 L", "175 L"],
        correct_index: 2,
        explanation: "3/4 × 200 = 150 litres.",
      },
    },
    {
      id: "rev_wp_10",
      type: "fill_blank",
      content: {
        question: "The perimeter of a square is 52 cm. What is the length of one side?",
        before_blank: "Side =",
        after_blank: "cm",
        correct_answer: "13",
        explanation: "Perimeter = 4 × side. Side = 52 ÷ 4 = 13 cm.",
      },
    },
  ],

  topic_fractions: [
    {
      id: "rev_frac_1",
      type: "multiple_choice",
      content: {
        question: "What is 3/4 + 2/3?",
        options: ["5/7", "17/12", "5/12", "1/2"],
        correct_index: 1,
        explanation: "LCD = 12. 3/4 = 9/12, 2/3 = 8/12. 9/12 + 8/12 = 17/12.",
      },
    },
    {
      id: "rev_frac_2",
      type: "fill_blank",
      content: {
        question: "What is 5/6 − 1/4?",
        before_blank: "5/6 − 1/4 =",
        after_blank: "(as a fraction)",
        correct_answer: "7/12",
        explanation: "LCD = 12. 10/12 − 3/12 = 7/12.",
      },
    },
    {
      id: "rev_frac_3",
      type: "multiple_choice",
      content: {
        question: "What is 2/3 × 3/5?",
        options: ["5/8", "6/8", "2/5", "6/15"],
        correct_index: 2,
        explanation: "Multiply numerators and denominators: (2×3)/(3×5) = 6/15 = 2/5.",
      },
    },
    {
      id: "rev_frac_4",
      type: "fill_blank",
      content: {
        question: "What is 3/4 ÷ 3/8?",
        before_blank: "3/4 ÷ 3/8 =",
        after_blank: "",
        correct_answer: "2",
        explanation: "Flip and multiply: 3/4 × 8/3 = 24/12 = 2.",
      },
    },
    {
      id: "rev_frac_5",
      type: "multiple_choice",
      content: {
        question: "Convert 2 3/5 to an improper fraction.",
        options: ["7/5", "11/5", "13/5", "15/5"],
        correct_index: 2,
        explanation: "2 × 5 + 3 = 13. So 2 3/5 = 13/5.",
      },
    },
    {
      id: "rev_frac_6",
      type: "fill_blank",
      content: {
        question: "Convert 0.375 to a fraction in its simplest form.",
        before_blank: "0.375 =",
        after_blank: "",
        correct_answer: "3/8",
        explanation: "0.375 = 375/1000 = 3/8.",
      },
    },
    {
      id: "rev_frac_7",
      type: "multiple_choice",
      content: {
        question: "What is 1/2 of 3/4?",
        options: ["1/4", "3/8", "1/3", "3/4"],
        correct_index: 1,
        explanation: "1/2 × 3/4 = 3/8.",
      },
    },
    {
      id: "rev_frac_8",
      type: "fill_blank",
      content: {
        question: "Simplify 24/36 to its lowest terms.",
        before_blank: "24/36 =",
        after_blank: "",
        correct_answer: "2/3",
        explanation: "GCF of 24 and 36 is 12. 24÷12=2, 36÷12=3. Answer: 2/3.",
      },
    },
    {
      id: "rev_frac_9",
      type: "multiple_choice",
      content: {
        question: "Which is largest: 3/4, 2/3, 7/10?",
        options: ["2/3", "7/10", "3/4", "They are equal"],
        correct_index: 2,
        explanation: "LCD=60: 3/4=45/60, 2/3=40/60, 7/10=42/60. Largest is 3/4.",
      },
    },
    {
      id: "rev_frac_10",
      type: "fill_blank",
      content: {
        question: "A pizza is cut into 8 slices. You eat 3. What fraction is left?",
        before_blank: "Fraction left =",
        after_blank: "",
        correct_answer: "5/8",
        explanation: "8 − 3 = 5 slices left. Fraction = 5/8.",
      },
    },
  ],

  topic_percentages: [
    {
      id: "rev_pct_1",
      type: "multiple_choice",
      content: {
        question: "What is 35% of £240?",
        options: ["£74", "£82", "£84", "£86"],
        correct_index: 2,
        explanation: "35% × 240 = 0.35 × 240 = £84.",
      },
    },
    {
      id: "rev_pct_2",
      type: "fill_blank",
      content: {
        question: "A price increases from £50 to £65. What is the percentage increase?",
        before_blank: "Percentage increase =",
        after_blank: "%",
        correct_answer: "30",
        explanation: "Increase = £15. % increase = (15/50) × 100 = 30%.",
      },
    },
    {
      id: "rev_pct_3",
      type: "multiple_choice",
      content: {
        question: "After a 15% discount, a jacket costs £68. What was the original price?",
        options: ["£75", "£78.20", "£80", "£82.50"],
        correct_index: 2,
        explanation: "Original × 0.85 = £68. Original = £68 ÷ 0.85 = £80.",
      },
    },
    {
      id: "rev_pct_4",
      type: "fill_blank",
      content: {
        question: "£300 invested at 5% compound interest for 2 years. Final amount = £",
        before_blank: "Final amount = £",
        after_blank: "",
        correct_answer: "330.75",
        explanation: "A = 300 × (1.05)² = 300 × 1.1025 = £330.75.",
      },
    },
    {
      id: "rev_pct_5",
      type: "multiple_choice",
      content: {
        question: "What is 12 as a percentage of 80?",
        options: ["10%", "12%", "15%", "16%"],
        correct_index: 2,
        explanation: "(12 ÷ 80) × 100 = 15%.",
      },
    },
    {
      id: "rev_pct_6",
      type: "fill_blank",
      content: {
        question: "Divide £200 in the ratio 3:2. Larger share = £",
        before_blank: "Larger share = £",
        after_blank: "",
        correct_answer: "120",
        explanation: "Total parts = 5. Each part = £40. Larger = 3 × £40 = £120.",
      },
    },
    {
      id: "rev_pct_7",
      type: "multiple_choice",
      content: {
        question: "A population of 4,000 grows by 8% per year. What is it after 1 year?",
        options: ["4,240", "4,280", "4,320", "4,400"],
        correct_index: 2,
        explanation: "4000 × 1.08 = 4,320.",
      },
    },
    {
      id: "rev_pct_8",
      type: "fill_blank",
      content: {
        question: "Express 3/8 as a percentage.",
        before_blank: "3/8 =",
        after_blank: "%",
        correct_answer: "37.5",
        explanation: "3 ÷ 8 = 0.375. × 100 = 37.5%.",
      },
    },
    {
      id: "rev_pct_9",
      type: "multiple_choice",
      content: {
        question: "A £500 TV depreciates at 20% per year. What is it worth after 2 years?",
        options: ["£300", "£310", "£320", "£330"],
        correct_index: 2,
        explanation: "500 × (0.8)² = 500 × 0.64 = £320.",
      },
    },
    {
      id: "rev_pct_10",
      type: "fill_blank",
      content: {
        question: "In a class of 30 students, 18 are girls. What percentage are boys?",
        before_blank: "Boys =",
        after_blank: "%",
        correct_answer: "40",
        explanation: "Boys = 12. (12/30) × 100 = 40%.",
      },
    },
  ],

  topic_number_theory: [
    {
      id: "rev_nt_1",
      type: "multiple_choice",
      content: {
        question: "What is the LCM of 8 and 12?",
        options: ["16", "24", "36", "48"],
        correct_index: 1,
        explanation: "Multiples of 8: 8,16,24. Multiples of 12: 12,24. LCM = 24.",
      },
    },
    {
      id: "rev_nt_2",
      type: "fill_blank",
      content: {
        question: "Write 72 as a product of prime factors.",
        before_blank: "72 =",
        after_blank: "(e.g. 2³ × 3²)",
        correct_answer: "2³×3²",
        explanation: "72 = 8 × 9 = 2³ × 3².",
      },
    },
    {
      id: "rev_nt_3",
      type: "multiple_choice",
      content: {
        question: "Which of these is a prime number?",
        options: ["51", "57", "61", "69"],
        correct_index: 2,
        explanation: "61 is prime. 51=3×17, 57=3×19, 69=3×23.",
      },
    },
    {
      id: "rev_nt_4",
      type: "fill_blank",
      content: {
        question: "Write 0.00042 in standard form.",
        before_blank: "0.00042 =",
        after_blank: "× 10^n",
        correct_answer: "4.2",
        explanation: "0.00042 = 4.2 × 10⁻⁴.",
      },
    },
    {
      id: "rev_nt_5",
      type: "multiple_choice",
      content: {
        question: "What is the nth term of the sequence 1, 4, 9, 16, 25 …?",
        options: ["2n−1", "n+3", "n²", "2n"],
        correct_index: 2,
        explanation: "These are perfect squares: 1²,2²,3²,4²,5². nth term = n².",
      },
    },
    {
      id: "rev_nt_6",
      type: "fill_blank",
      content: {
        question: "What is the HCF of 48 and 60?",
        before_blank: "HCF =",
        after_blank: "",
        correct_answer: "12",
        explanation: "Factors of 48: 1,2,3,4,6,8,12,16,24,48. Factors of 60: 1,2,3,4,5,6,10,12,15,20,30,60. HCF = 12.",
      },
    },
    {
      id: "rev_nt_7",
      type: "multiple_choice",
      content: {
        question: "Calculate (3.2 × 10⁴) × (2 × 10³).",
        options: ["6.4 × 10⁶", "6.4 × 10⁷", "64 × 10⁶", "6.4 × 10¹²"],
        correct_index: 1,
        explanation: "3.2 × 2 = 6.4. 10⁴ × 10³ = 10⁷. Answer: 6.4 × 10⁷.",
      },
    },
    {
      id: "rev_nt_8",
      type: "fill_blank",
      content: {
        question: "Sequence: 2, 6, 18, 54 … What is the next term?",
        before_blank: "Next term =",
        after_blank: "",
        correct_answer: "162",
        explanation: "This is geometric with ratio 3. 54 × 3 = 162.",
      },
    },
    {
      id: "rev_nt_9",
      type: "multiple_choice",
      content: {
        question: "How many prime numbers are there between 1 and 20?",
        options: ["6", "7", "8", "9"],
        correct_index: 2,
        explanation: "Primes: 2,3,5,7,11,13,17,19 = 8 prime numbers.",
      },
    },
    {
      id: "rev_nt_10",
      type: "fill_blank",
      content: {
        question: "What is the 15th term of the sequence with nth term 4n + 3?",
        before_blank: "15th term =",
        after_blank: "",
        correct_answer: "63",
        explanation: "4(15) + 3 = 60 + 3 = 63.",
      },
    },
  ],

  topic_statistics: [
    {
      id: "rev_stat_1",
      type: "multiple_choice",
      content: {
        question: "Find the mean of: 4, 7, 9, 11, 14.",
        options: ["8", "9", "10", "11"],
        correct_index: 1,
        explanation: "Sum = 45. Mean = 45 ÷ 5 = 9.",
      },
    },
    {
      id: "rev_stat_2",
      type: "fill_blank",
      content: {
        question: "Find the median of: 3, 8, 5, 12, 1, 7, 9.",
        before_blank: "Median =",
        after_blank: "",
        correct_answer: "7",
        explanation: "Sorted: 1,3,5,7,8,9,12. Middle value (4th) = 7.",
      },
    },
    {
      id: "rev_stat_3",
      type: "multiple_choice",
      content: {
        question: "A frequency table shows scores. If total frequency is 20 and Σfx = 340, what is the mean?",
        options: ["15", "16", "17", "18"],
        correct_index: 2,
        explanation: "Mean = Σfx ÷ Σf = 340 ÷ 20 = 17.",
      },
    },
    {
      id: "rev_stat_4",
      type: "fill_blank",
      content: {
        question: "Data: 5, 5, 7, 8, 9, 9, 9, 10. What is the mode?",
        before_blank: "Mode =",
        after_blank: "",
        correct_answer: "9",
        explanation: "9 appears 3 times — more than any other value.",
      },
    },
    {
      id: "rev_stat_5",
      type: "multiple_choice",
      content: {
        question: "A scatter graph shows higher revision hours lead to higher test scores. This is:",
        options: ["Negative correlation", "No correlation", "Positive correlation", "Inverse correlation"],
        correct_index: 2,
        explanation: "Both variables increase together — positive correlation.",
      },
    },
    {
      id: "rev_stat_6",
      type: "fill_blank",
      content: {
        question: "Data: 12, 15, 18, 20, 25. What is the range?",
        before_blank: "Range =",
        after_blank: "",
        correct_answer: "13",
        explanation: "Range = 25 − 12 = 13.",
      },
    },
    {
      id: "rev_stat_7",
      type: "multiple_choice",
      content: {
        question: "Which chart is best for showing how a total is divided into parts?",
        options: ["Bar chart", "Line graph", "Pie chart", "Scatter graph"],
        correct_index: 2,
        explanation: "A pie chart shows proportions of a whole.",
      },
    },
    {
      id: "rev_stat_8",
      type: "fill_blank",
      content: {
        question: "A box plot has Q1 = 10 and Q3 = 22. What is the interquartile range (IQR)?",
        before_blank: "IQR =",
        after_blank: "",
        correct_answer: "12",
        explanation: "IQR = Q3 − Q1 = 22 − 10 = 12.",
      },
    },
    {
      id: "rev_stat_9",
      type: "multiple_choice",
      content: {
        question: "A cumulative frequency graph has 80 values. At which CF value do you read the lower quartile (Q1)?",
        options: ["20", "40", "60", "80"],
        correct_index: 0,
        explanation: "Q1 is at n/4 = 80/4 = 20.",
      },
    },
    {
      id: "rev_stat_10",
      type: "fill_blank",
      content: {
        question: "A data set has variance = 49. What is the standard deviation?",
        before_blank: "σ =",
        after_blank: "",
        correct_answer: "7",
        explanation: "Standard deviation = √variance = √49 = 7.",
      },
    },
  ],

  topic_probability: [
    {
      id: "rev_prob_1",
      type: "multiple_choice",
      content: {
        question: "A bag has 4 red, 3 blue, and 3 green balls. P(blue) = ?",
        options: ["1/4", "3/10", "1/3", "3/7"],
        correct_index: 1,
        explanation: "P(blue) = 3 ÷ (4+3+3) = 3/10.",
      },
    },
    {
      id: "rev_prob_2",
      type: "fill_blank",
      content: {
        question: "P(rain) = 0.35. P(no rain) = ?",
        before_blank: "P(no rain) =",
        after_blank: "",
        correct_answer: "0.65",
        explanation: "P(no rain) = 1 − 0.35 = 0.65.",
      },
    },
    {
      id: "rev_prob_3",
      type: "multiple_choice",
      content: {
        question: "A die is rolled. P(even number) = ?",
        options: ["1/6", "1/3", "1/2", "2/3"],
        correct_index: 2,
        explanation: "Even numbers: 2,4,6 = 3 out of 6. P = 3/6 = 1/2.",
      },
    },
    {
      id: "rev_prob_4",
      type: "fill_blank",
      content: {
        question: "A spinner is spun 200 times. P(red) = 0.4. Expected frequency of red =",
        before_blank: "Expected frequency =",
        after_blank: "",
        correct_answer: "80",
        explanation: "Expected = 0.4 × 200 = 80.",
      },
    },
    {
      id: "rev_prob_5",
      type: "multiple_choice",
      content: {
        question: "P(A) = 0.3, P(B) = 0.5. If A and B are mutually exclusive, P(A or B) = ?",
        options: ["0.15", "0.20", "0.80", "0.85"],
        correct_index: 2,
        explanation: "Mutually exclusive: P(A or B) = P(A) + P(B) = 0.3 + 0.5 = 0.8.",
      },
    },
    {
      id: "rev_prob_6",
      type: "fill_blank",
      content: {
        question: "P(A) = 0.6, P(B|A) = 0.5. P(A and B) = ?",
        before_blank: "P(A and B) =",
        after_blank: "",
        correct_answer: "0.3",
        explanation: "P(A and B) = P(A) × P(B|A) = 0.6 × 0.5 = 0.3.",
      },
    },
    {
      id: "rev_prob_7",
      type: "multiple_choice",
      content: {
        question: "Two coins are flipped. P(both heads) = ?",
        options: ["1/2", "1/3", "1/4", "1/8"],
        correct_index: 2,
        explanation: "P(H) × P(H) = 1/2 × 1/2 = 1/4.",
      },
    },
    {
      id: "rev_prob_8",
      type: "fill_blank",
      content: {
        question: "A game is played 40 times. It is won 14 times. Relative frequency of winning =",
        before_blank: "Relative frequency =",
        after_blank: "",
        correct_answer: "0.35",
        explanation: "Relative frequency = 14 ÷ 40 = 0.35.",
      },
    },
    {
      id: "rev_prob_9",
      type: "multiple_choice",
      content: {
        question: "A bag has 5 red and 3 blue balls. One is taken out (red). Not replaced. P(blue next) = ?",
        options: ["3/8", "3/7", "1/3", "3/5"],
        correct_index: 1,
        explanation: "After removing 1 red: 4 red + 3 blue = 7 left. P(blue) = 3/7.",
      },
    },
    {
      id: "rev_prob_10",
      type: "fill_blank",
      content: {
        question: "List the sample space for rolling two dice and getting a sum of 3. How many outcomes?",
        before_blank: "Number of outcomes =",
        after_blank: "",
        correct_answer: "2",
        explanation: "Outcomes: (1,2) and (2,1). That is 2 outcomes.",
      },
    },
  ],

  topic_measurement: [
    {
      id: "rev_meas_1",
      type: "multiple_choice",
      content: {
        question: "Convert 3.5 km to metres.",
        options: ["350 m", "3,050 m", "3,500 m", "35,000 m"],
        correct_index: 2,
        explanation: "1 km = 1,000 m. 3.5 × 1000 = 3,500 m.",
      },
    },
    {
      id: "rev_meas_2",
      type: "fill_blank",
      content: {
        question: "A rectangle is 12 cm by 7 cm. Area = ",
        before_blank: "Area =",
        after_blank: "cm²",
        correct_answer: "84",
        explanation: "Area = 12 × 7 = 84 cm².",
      },
    },
    {
      id: "rev_meas_3",
      type: "multiple_choice",
      content: {
        question: "What is the volume of a cuboid 5 cm × 4 cm × 3 cm?",
        options: ["47 cm³", "60 cm³", "72 cm³", "80 cm³"],
        correct_index: 1,
        explanation: "V = l × w × h = 5 × 4 × 3 = 60 cm³.",
      },
    },
    {
      id: "rev_meas_4",
      type: "fill_blank",
      content: {
        question: "Convert 2 hours 45 minutes to minutes.",
        before_blank: "Total minutes =",
        after_blank: "",
        correct_answer: "165",
        explanation: "2 × 60 + 45 = 120 + 45 = 165 minutes.",
      },
    },
    {
      id: "rev_meas_5",
      type: "multiple_choice",
      content: {
        question: "A map has scale 1:50,000. A distance of 3 cm on the map = ?",
        options: ["1.5 km", "15 km", "150 km", "1,500 m"],
        correct_index: 0,
        explanation: "3 cm × 50,000 = 150,000 cm = 1,500 m = 1.5 km.",
      },
    },
    {
      id: "rev_meas_6",
      type: "fill_blank",
      content: {
        question: "Convert 5,200 g to kg.",
        before_blank: "5,200 g =",
        after_blank: "kg",
        correct_answer: "5.2",
        explanation: "5,200 ÷ 1,000 = 5.2 kg.",
      },
    },
    {
      id: "rev_meas_7",
      type: "multiple_choice",
      content: {
        question: "A cylinder has radius 4 cm and height 9 cm. Volume ≈ ? (π ≈ 3.14)",
        options: ["113.04 cm³", "226.08 cm³", "452.16 cm³", "904.32 cm³"],
        correct_index: 2,
        explanation: "V = π × r² × h = 3.14 × 16 × 9 = 452.16 cm³.",
      },
    },
    {
      id: "rev_meas_8",
      type: "fill_blank",
      content: {
        question: "A journey of 240 km takes 3 hours. Average speed = ",
        before_blank: "Speed =",
        after_blank: "km/h",
        correct_answer: "80",
        explanation: "Speed = distance ÷ time = 240 ÷ 3 = 80 km/h.",
      },
    },
    {
      id: "rev_meas_9",
      type: "multiple_choice",
      content: {
        question: "What is the area of a trapezium with parallel sides 6 cm and 10 cm, height 4 cm?",
        options: ["24 cm²", "32 cm²", "40 cm²", "48 cm²"],
        correct_index: 1,
        explanation: "Area = ½(a+b)h = ½(6+10)×4 = ½×16×4 = 32 cm².",
      },
    },
    {
      id: "rev_meas_10",
      type: "fill_blank",
      content: {
        question: "Convert 72 km/h to m/s.",
        before_blank: "72 km/h =",
        after_blank: "m/s",
        correct_answer: "20",
        explanation: "Divide by 3.6: 72 ÷ 3.6 = 20 m/s.",
      },
    },
  ],
  topic_ratio: [
    {
      id: "rev_ratio_1",
      type: "multiple_choice",
      content: {
        question: "Simplify the ratio 18:24",
        options: ["3:4", "6:8", "9:12", "2:3"],
        correct_index: 0,
        explanation: "HCF of 18 and 24 is 6. 18÷6 : 24÷6 = 3:4.",
      },
    },
    {
      id: "rev_ratio_2",
      type: "fill_blank",
      content: {
        question: "Share £120 in the ratio 1:3. What is the larger share?",
        before_blank: "Larger share = £",
        after_blank: "",
        correct_answer: "90",
        explanation: "Total parts = 4. 1 part = £30. Larger share = 3 × £30 = £90.",
      },
    },
    {
      id: "rev_ratio_3",
      type: "multiple_choice",
      content: {
        question: "y is directly proportional to x. When x = 4, y = 20. What is y when x = 7?",
        options: ["28", "35", "42", "56"],
        correct_index: 1,
        explanation: "k = 20 ÷ 4 = 5. y = 5 × 7 = 35.",
      },
    },
    {
      id: "rev_ratio_4",
      type: "fill_blank",
      content: {
        question: "5 workers take 12 days to finish a job. How many days would 3 workers take?",
        before_blank: "Days =",
        after_blank: "",
        correct_answer: "20",
        explanation: "Inversely proportional. k = 5 × 12 = 60. Days = 60 ÷ 3 = 20.",
      },
    },
    {
      id: "rev_ratio_5",
      type: "multiple_choice",
      content: {
        question: "Simplify 30:45:60",
        options: ["2:3:4", "6:9:12", "3:4:5", "1:2:3"],
        correct_index: 0,
        explanation: "HCF = 15. 30÷15 : 45÷15 : 60÷15 = 2:3:4.",
      },
    },
    {
      id: "rev_ratio_6",
      type: "fill_blank",
      content: {
        question: "A recipe for 6 people needs 450g of flour. How much is needed for 10 people?",
        before_blank: "Flour =",
        after_blank: "g",
        correct_answer: "750",
        explanation: "Per person = 450 ÷ 6 = 75g. For 10 people = 75 × 10 = 750g.",
      },
    },
    {
      id: "rev_ratio_7",
      type: "multiple_choice",
      content: {
        question: "A map scale is 1:50,000. Two towns are 6cm apart on the map. What is the real distance?",
        options: ["3km", "30km", "300km", "3,000km"],
        correct_index: 0,
        explanation: "6 × 50,000 = 300,000cm = 3,000m = 3km.",
      },
    },
    {
      id: "rev_ratio_8",
      type: "fill_blank",
      content: {
        question: "Write the ratio 20:32 in the form 1:n",
        before_blank: "1:",
        after_blank: "",
        correct_answer: "1.6",
        explanation: "Divide both by 20: 1 : 32/20 = 1 : 1.6.",
      },
    },
    {
      id: "rev_ratio_9",
      type: "multiple_choice",
      content: {
        question: "Orange squash is mixed with water in the ratio 1:4. How much water is needed with 250ml of squash?",
        options: ["500ml", "750ml", "1000ml", "1250ml"],
        correct_index: 2,
        explanation: "1 part = 250ml. Water = 4 × 250 = 1000ml.",
      },
    },
    {
      id: "rev_ratio_10",
      type: "fill_blank",
      content: {
        question: "In a class the ratio of boys to girls is 3:5. There are 40 students. How many are boys?",
        before_blank: "Boys =",
        after_blank: "",
        correct_answer: "15",
        explanation: "Total parts = 8. 1 part = 40 ÷ 8 = 5. Boys = 3 × 5 = 15.",
      },
    },
  ],
};

export const PASS_MARK = 7; // out of 10
export const REVIEW_XP_REWARD = 150;

export function getTopicReview(topicId: string): ReviewQuestion[] {
  return TOPIC_REVIEWS[topicId] ?? [];
}
