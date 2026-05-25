import { useState } from 'react';
import { Calculator, MessageSquare, Brain, BarChart2, ChevronRight, Lightbulb, BookOpen, Hash, Zap } from 'lucide-react';

/* ─── All prerequisite content ─────────────────────────────── */
const SECTIONS = [
  {
    id: 'quant',
    label: 'Quantitative Aptitude',
    icon: Calculator,
    color: { tab: 'indigo', accent: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', badge: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-500/30', active: 'bg-indigo-600 dark:bg-indigo-500' },
    topics: [
      {
        name: 'Percentages',
        formulas: [
          'Percentage = (Part / Whole) × 100',
          'Percentage increase = [(New − Old) / Old] × 100',
          'Percentage decrease = [(Old − New) / Old] × 100',
          'If A is x% more than B → B is [x / (100 + x)] × 100 % less than A',
          'If A is x% less than B → B is [x / (100 − x)] × 100 % more than A',
          'Successive % change of a% then b% → Net = a + b + ab/100',
        ],
        approach: [
          'Convert % to fraction/decimal first for faster calculation',
          'Use multiplier method: 20% increase → multiply by 1.2',
          'For compound successive changes apply the net-change formula',
          'To find original value: work backwards using divide',
        ],
        tips: [
          '10% of any number = move decimal one place left',
          '1% of any number = divide by 100',
          'Use 12.5% = 1/8, 16.67% = 1/6, 33.33% = 1/3, 66.67% = 2/3',
          'Learn fraction equivalents: 25%=1/4, 20%=1/5, 12.5%=1/8',
        ],
      },
      {
        name: 'Profit & Loss',
        formulas: [
          'Profit = SP − CP',
          'Loss = CP − SP',
          'Profit% = (Profit / CP) × 100',
          'Loss% = (Loss / CP) × 100',
          'SP = CP × (100 + P%) / 100',
          'CP = SP × 100 / (100 + P%)   [for profit]',
          'CP = SP × 100 / (100 − L%)   [for loss]',
          'Dishonest trader profit% = [Error / (True weight − Error)] × 100',
          'Equivalent single discount for d1 then d2 → d1 + d2 − d1·d2/100',
        ],
        approach: [
          'Always anchor calculations to CP (cost price)',
          'Marked price → after discount → SP → compare with CP',
          'For two articles at same SP but one x% profit, one x% loss → always net loss = (x/10)²%',
        ],
        tips: [
          'If SP is given with profit%, use CP = SP × 100/(100+P)',
          'Selling two items at same price with +x% and -x% always results in loss',
          'Fake weight trick: profit% = error/(true weight - error) × 100',
        ],
      },
      {
        name: 'Time, Speed & Distance',
        formulas: [
          'Speed = Distance / Time',
          'Average Speed (equal distance) = 2ab / (a + b)',
          'Relative speed (same direction) = |s1 − s2|',
          'Relative speed (opposite direction) = s1 + s2',
          'Train crossing a pole/person: Time = Length of train / Speed',
          'Train crossing a platform: Time = (L_train + L_platform) / Speed',
          'Boats upstream speed = b − w; downstream = b + w',
          'Still water speed = (up + down) / 2; Current = (down − up) / 2',
        ],
        approach: [
          'Convert units first — km/hr to m/s: multiply by 5/18',
          'Draw timeline for meeting problems',
          'Use relative speed for trains/chase problems',
        ],
        tips: [
          'km/hr → m/s: × 5/18;  m/s → km/hr: × 18/5',
          'If ratio of speeds = a:b → ratio of times = b:a (same distance)',
          'Boats: memorise upstream = b−w, downstream = b+w',
        ],
      },
      {
        name: 'Time & Work',
        formulas: [
          'Work = Rate × Time',
          'If A does job in n days → A\'s 1-day work = 1/n',
          'Combined: 1/A + 1/B = 1/T',
          'Efficiency is inversely proportional to time',
          'Pipes: Inlet fills in p hrs, outlet empties in q hrs → net = pq/(q−p)',
          'Man·days formula: M₁D₁/W₁ = M₂D₂/W₂',
        ],
        approach: [
          'Assign LCM of all times as total work (makes fractions whole numbers)',
          'Calculate per-day work for each person, then add/subtract',
          'For alternating days, find work done in one full cycle',
        ],
        tips: [
          'LCM method avoids fractions — highly recommended',
          'Negative efficiency = workers that destroy/obstruct work',
          'If A is twice as efficient as B → A takes half the time',
        ],
      },
      {
        name: 'Simple & Compound Interest',
        formulas: [
          'SI = P × R × T / 100',
          'CI = P × (1 + R/100)ⁿ − P',
          'Amount (SI) = P + SI',
          'Amount (CI) = P × (1 + R/100)ⁿ',
          'CI − SI for 2 years = P(R/100)²',
          'CI − SI for 3 years = P(R/100)²(R/100 + 3)',
          'Effective annual rate for half-yearly: (1 + R/200)² − 1',
        ],
        approach: [
          'SI problems: straightforward formula application',
          'CI: use power formula; for 2 years shortcut available',
          'To find P, R, or T — rearrange the formula algebraically',
        ],
        tips: [
          'CI > SI always (for same P, R, T > 1 year)',
          'For 2-year CI use: CI = SI + SI²/(100×2P) or just (P·R²)/10000',
          'Half-yearly: R halved, T doubled; quarterly: R quartered, T×4',
        ],
      },
      {
        name: 'Ratio & Proportion',
        formulas: [
          'Ratio a:b = a/b',
          'Proportion: a:b = c:d → ad = bc (cross multiply)',
          'Componendo: (a+b)/b = (c+d)/d',
          'Dividendo: (a−b)/b = (c−d)/d',
          'Componendo & Dividendo: (a+b)/(a−b) = (c+d)/(c−d)',
          'Mean proportion of a & b = √(ab)',
          'Third proportion of a, b = b²/a',
        ],
        approach: [
          'Convert all ratios to same base before comparing',
          'For mixture problems: apply alligation cross method',
          'Partnership profit ∝ Capital × Time',
        ],
        tips: [
          'a:b:c from a:b and b:c — make b equal by LCM',
          'Alligation: (C₂−Mean) : (Mean−C₁) gives mixing ratio',
          'Partnership: if times differ, multiply capital by time',
        ],
      },
      {
        name: 'Number System',
        formulas: [
          'Sum of first n naturals = n(n+1)/2',
          'Sum of first n squares = n(n+1)(2n+1)/6',
          'Sum of first n cubes = [n(n+1)/2]²',
          'Divisibility: 2→even; 3→digit sum ÷3; 4→last 2 digits ÷4; 9→digit sum ÷9; 11→alt digit diff',
          'HCF × LCM = Product of two numbers',
          'Number of factors of n = (a+1)(b+1)… where n = pᵃ·qᵇ…',
        ],
        approach: [
          'For remainder problems use modular arithmetic',
          'Cyclicity of units digit: 2(4), 3(4), 7(4), 8(4), others(1 or 2)',
          'For divisibility chain problems, break into prime factors',
        ],
        tips: [
          'Units digit of powers repeats in cycles of 2 or 4',
          '0 and 1 are neither prime nor composite',
          'Any number × 9 → digit sum is always 9',
          'Perfect squares end in 0,1,4,5,6,9 only',
        ],
      },
      {
        name: 'Averages',
        formulas: [
          'Average = Sum / Count',
          'Sum = Average × Count',
          'New Average (add element x to n items) = (Old Sum + x) / (n+1)',
          'Weighted Average = (w₁x₁ + w₂x₂) / (w₁ + w₂)',
        ],
        approach: [
          'Find the "deviation from assumed mean" to simplify large numbers',
          'Increase in sum = Increase in average × Count',
          'For age problems — note year difference affects all ages',
        ],
        tips: [
          'Assume any middle value as working average to reduce arithmetic',
          'If a value is replaced: change in sum = new − old',
          'Average of consecutive numbers = (first + last) / 2',
        ],
      },
      {
        name: 'Permutations & Combinations',
        formulas: [
          'nPr = n! / (n−r)!',
          'nCr = n! / [r! × (n−r)!]',
          'nCr = nC(n−r)',
          'nC0 = nCn = 1',
          'Total subsets of n elements = 2ⁿ',
          'Circular permutations = (n−1)!',
          'Arrangements with identical items = n! / (p!·q!…)',
        ],
        approach: [
          'P for arrangements (order matters), C for selections (order doesn\'t)',
          'Keyword "arrange" → P; keyword "choose/select/committee" → C',
          'Apply restrictions first (fix restricted items), then arrange rest',
        ],
        tips: [
          'TOGETHER → treat as one unit, then multiply by arrangements within',
          'NOT TOGETHER → Total − (Together cases)',
          'Vowels always together is a classic grouping trick',
          '0! = 1 always',
        ],
      },
      {
        name: 'Probability',
        formulas: [
          'P(E) = Favourable outcomes / Total outcomes',
          'P(A ∪ B) = P(A) + P(B) − P(A ∩ B)',
          'P(A ∩ B) = P(A) × P(B)  [if independent]',
          'P(A̅) = 1 − P(A)',
          'Conditional: P(A|B) = P(A ∩ B) / P(B)',
          'Odds in favour = P(E) / P(Ē);  Odds against = P(Ē) / P(E)',
        ],
        approach: [
          'List sample space clearly before computing',
          'Use complement method when "at least one" is involved',
          'Draw/cards/balls: enumerate directly or use combinations',
        ],
        tips: [
          '"At least one" = 1 − P(none)',
          'Two dice: total outcomes = 36',
          'Deck of cards: 52 cards, 4 suits, 13 each',
          'Independent events multiply; mutually exclusive add',
        ],
      },
      {
        name: 'Geometry & Mensuration',
        formulas: [
          'Circle: Area = πr², Circumference = 2πr',
          'Triangle: Area = ½ × base × height; Heron\'s = √[s(s−a)(s−b)(s−c)]',
          'Rectangle: Area = l×b, Perimeter = 2(l+b)',
          'Cylinder: Volume = πr²h, CSA = 2πrh, TSA = 2πr(r+h)',
          'Cone: Volume = ⅓πr²h, Slant l = √(r²+h²), CSA = πrl',
          'Sphere: Volume = 4/3 πr³, Surface = 4πr²',
          'Cuboid: Volume = l×b×h, TSA = 2(lb+bh+hl)',
        ],
        approach: [
          'Identify 2D or 3D shape first',
          'For combined figures: split into basic shapes',
          'Unit conversion: 1m = 100cm, 1m² = 10000cm²',
        ],
        tips: [
          'π ≈ 22/7 for calculation, 3.14 for estimation',
          'Equilateral triangle area = (√3/4)a²',
          'If radius doubled → area becomes 4× (not 2×)',
          'Diagonal of square = a√2; rectangle = √(l²+b²)',
        ],
      },
      {
        name: 'Progressions (AP & GP)',
        formulas: [
          'AP: nth term = a + (n−1)d',
          'AP: Sum of n terms = n/2 × [2a + (n−1)d]  or  n/2 × (first + last)',
          'GP: nth term = a × rⁿ⁻¹',
          'GP: Sum = a(rⁿ−1)/(r−1) for r≠1',
          'GP: Sum to infinity = a/(1−r), |r| < 1',
          'AM ≥ GM ≥ HM  (AM-GM-HM inequality)',
          'AM of a, b = (a+b)/2;  GM = √(ab);  HM = 2ab/(a+b)',
        ],
        approach: [
          'Check if differences are constant (AP) or ratios constant (GP)',
          'For sum problems identify a, d or a, r first',
          'Missing terms: insert required arithmetic/geometric means',
        ],
        tips: [
          'Three terms in AP: take as a−d, a, a+d',
          'Three terms in GP: take as a/r, a, ar',
          'Sum of AP can also be written as n × (average of AP)',
        ],
      },
    ],
  },
  {
    id: 'verbal',
    label: 'Verbal Ability',
    icon: MessageSquare,
    color: { tab: 'emerald', accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30', active: 'bg-emerald-600 dark:bg-emerald-500' },
    topics: [
      {
        name: 'Reading Comprehension',
        formulas: [],
        approach: [
          'Skim the passage first (30 sec) to get the gist',
          'Read questions before the passage to know what to look for',
          'Underline key names, dates, contrasts (but/however/although)',
          'For "main idea" questions — avoid too narrow or too broad options',
          'Inference questions: answer must follow from passage, not outside knowledge',
        ],
        tips: [
          'Tone words: author\'s attitude is often the key to correct answers',
          '"Except/Not" questions — eliminate three correct ones',
          'Vocabulary-in-context: re-read the surrounding sentence',
          'Avoid answers that are extreme (always, never, all, none)',
        ],
      },
      {
        name: 'Para Jumbles',
        formulas: [],
        approach: [
          'Identify the opening sentence: it introduces a concept without pronoun references',
          'Look for pronoun (it, he, they) → must follow the noun it refers to',
          'Connectors: "However, Moreover, Therefore, Thus" signal the next logical step',
          'Conclusion sentence: wraps up, often starts with "Thus/Finally/In conclusion"',
        ],
        tips: [
          'Eliminate options with obvious wrong first/last sentences',
          'Time clues: first event → later event',
          'Define something before describing it',
          'Eliminate pairs — if A must come before B, eliminate options where B precedes A',
        ],
      },
      {
        name: 'Sentence Correction',
        formulas: [],
        approach: [
          'Check Subject-Verb agreement first (singular/plural)',
          'Check verb tense consistency throughout the sentence',
          'Check pronoun reference: pronoun must match antecedent in number',
          'Watch for dangling/misplaced modifiers',
          'Parallel structure: list items must be in the same grammatical form',
        ],
        tips: [
          'Collective nouns (team, committee) take singular verb',
          '"Either/or" and "neither/nor" — verb agrees with closer subject',
          '"Between" uses two items; "Among" uses three or more',
          '"Fewer" for countable; "Less" for uncountable',
          '"Number of" → plural verb; "Amount of" → singular verb',
        ],
      },
      {
        name: 'Fill in the Blanks',
        formulas: [],
        approach: [
          'Identify the tone of the sentence (positive/negative/neutral)',
          'Look for clue words: contrast (but, yet, however) or support (and, also, similarly)',
          'Elimination: knock out options that change the tone',
          'For double blanks: check both words together — one wrong eliminates the pair',
        ],
        tips: [
          'Negative words flip tone: "not without" = positive',
          'Colons (:) usually introduce a definition or example — blank before = summary of rest',
          'Learn common collocations: "dire consequences", "vehement opposition"',
        ],
      },
      {
        name: 'Synonyms & Antonyms',
        formulas: [],
        approach: [
          'Break unfamiliar words into roots, prefixes, suffixes',
          'Use contextual clues if the word appears in a sentence',
          'Prefixes: un-, in-, dis-, mal- → negative; bene- → good; poly- → many',
          'Roots: "mit/miss" → send; "vert" → turn; "scrib" → write; "dict" → say',
        ],
        tips: [
          'Antonym: take synonym first, then reverse',
          'Latin/Greek roots unlock hundreds of words',
          'HAPPY → Synonyms: elated, jubilant, ecstatic; Antonyms: morose, melancholic',
          'Build a daily word list of 10 new words',
        ],
      },
      {
        name: 'Idioms & Phrases',
        formulas: [],
        approach: [
          'Memorise meaning, not literal interpretation',
          'Look for the context — placement clarifies the correct idiom',
          'Common categories: body parts (cold feet, turn a blind eye), animals, colours',
        ],
        tips: [
          '"Bite the bullet" = endure something painful',
          '"Bite off more than you can chew" = take on too much',
          '"Under the weather" = feeling ill',
          '"Beat around the bush" = avoid the main point',
          '"Hit the nail on the head" = describe exactly',
          '"Let the cat out of the bag" = reveal a secret',
          '"Break a leg" = good luck',
          '"Cost an arm and a leg" = very expensive',
        ],
      },
      {
        name: 'Error Detection',
        formulas: [],
        approach: [
          'Read each part separately and identify which part sounds wrong',
          'Check: tense, S-V agreement, article usage, prepositions, conjunctions',
          'Articles: "a" before consonant sound, "an" before vowel sound',
          'Prepositions: "interested in", "good at", "afraid of", "responsible for"',
        ],
        tips: [
          '"No error" is a valid answer — don\'t force an error',
          'Adverbs modify verbs/adjectives, not nouns',
          '"Lay" needs an object; "Lie" doesn\'t',
          '"Advice" (noun) vs "Advise" (verb)',
          '"Affect" (verb) vs "Effect" (noun) in most cases',
        ],
      },
    ],
  },
  {
    id: 'logical',
    label: 'Logical Reasoning',
    icon: Brain,
    color: { tab: 'violet', accent: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', badge: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-500/30', active: 'bg-violet-600 dark:bg-violet-500' },
    topics: [
      {
        name: 'Coding–Decoding',
        formulas: [],
        approach: [
          'Find the positional shift: A→D means +3 shift',
          'Check if letters are reversed (A=Z, B=Y …) i.e., 27−position',
          'Look for pattern: FACE coded as ECBD → each letter −1',
          'For number codes: check ASCII positions or prime codes',
          'Sentence coding: check word order reversal or word substitution',
        ],
        tips: [
          'Always check BOTH forward and backward shifts',
          'Mixed codes: first half forward, second half backward',
          'Number codes: often A=1…Z=26 or A=26…Z=1',
          'Practice spotting "+1/−1, ×2, mirror" patterns quickly',
        ],
      },
      {
        name: 'Blood Relations',
        formulas: [],
        approach: [
          'Draw a family tree immediately on reading the problem',
          'Use M(male) F(female) circles/squares',
          'Process relationships one by one, linking to the tree',
          'Key terms: maternal = mother\'s side; paternal = father\'s side',
        ],
        tips: [
          'Son\'s wife = daughter-in-law; Wife\'s brother = brother-in-law',
          'Father\'s sister = Aunt; Mother\'s brother = Uncle',
          'Brother\'s son = Nephew; Sister\'s daughter = Niece',
          'Avoid assuming gender unless stated',
        ],
      },
      {
        name: 'Direction Sense',
        formulas: [],
        approach: [
          'Always draw the path as you read',
          'Standard: North up, South down, East right, West left',
          'Left turn rotates you −90°; Right turn rotates you +90°',
          'Final displacement = straight-line distance from start to end (not total path)',
          'Use Pythagoras for diagonal final distance',
        ],
        tips: [
          'After turning 180° you face opposite direction',
          'Shadow in morning = to West; Shadow in evening = to East',
          'Facing North, turn left → face West; turn right → face East',
          'Draw the compass rose at the start of each problem',
        ],
      },
      {
        name: 'Seating Arrangements',
        formulas: [],
        approach: [
          'Circular: fix one person, arrange rest in (n−1)! ways',
          'Linear: read definite clues first, then conditional clues',
          'Build a table/grid for double-row arrangements',
          'Mark "Facing centre" vs "Facing outside" carefully',
        ],
        tips: [
          'Start with the most constrained person (most clues)',
          'Use "NOT" clues to eliminate positions',
          'Two people together → treat as one unit',
          'For circular tables: "left" of A = anti-clockwise from A',
        ],
      },
      {
        name: 'Syllogisms',
        formulas: [],
        approach: [
          'Draw Venn diagrams for each statement',
          'Universal Affirmative (All A→B): A circle fully inside B',
          'Universal Negative (No A→B): Circles completely separate',
          'Particular Affirmative (Some A→B): Circles overlap',
          'Particular Negative (Some A not B): Part of A outside B',
          'Check each conclusion against the Venn diagram',
        ],
        tips: [
          '"All A is B" does NOT mean "All B is A"',
          '"Some A is B" ≡ "Some B is A" (reversible)',
          'No A is B → No B is A (reversible)',
          '"At least some" = possible conclusion when circles overlap',
          'Complementary pair: one of "Some A is B" or "No A is B" must be true',
        ],
      },
      {
        name: 'Number & Letter Series',
        formulas: [],
        approach: [
          'Check differences between terms (1st order)',
          'If differences not constant, check differences of differences (2nd order)',
          'Check ratios (×2, ×3, ÷2) — GP pattern',
          'Check squares or cubes: n², n³',
          'For letter series: convert to numbers (A=1, Z=26)',
          'Two interleaved series: check odd-position and even-position separately',
        ],
        tips: [
          'Mixed series: +1 then ×2 alternating is very common',
          'Prime number series: 2, 3, 5, 7, 11, 13…',
          'Fibonacci-like: each term = sum of two preceding',
          'Wrong number: find the pattern, compute what the term should be',
        ],
      },
      {
        name: 'Statement & Assumptions',
        formulas: [],
        approach: [
          'An assumption is something that is taken for granted (unstated but required)',
          'Check: Is the assumption implicit in the statement?',
          'Test by negation: if negating the assumption makes the statement meaningless → assumption holds',
          'Avoid over-reading or adding external facts',
        ],
        tips: [
          '"Given in the statement" ≠ assumption (don\'t restate obvious)',
          'Extreme/absolute words (always, never, all, none) → usually NOT valid assumptions',
          'If assumption is too broad, it\'s not specific to this statement',
          'Course of action: check if it directly addresses the problem in the statement',
        ],
      },
      {
        name: 'Puzzles',
        formulas: [],
        approach: [
          'Create a matrix/grid: rows = people/positions, columns = attributes',
          'Fill in definite clues first (direct statements)',
          'Use process of elimination for conditional clues',
          'Cross-reference clues to fill remaining cells',
        ],
        tips: [
          'Mark ✓ (confirmed) and ✗ (eliminated) in the grid',
          'Once a cell is ✓, mark ✗ for the same attribute in all other rows',
          'Re-read all clues after partial fill — new deductions become possible',
          'Time-box: if stuck after 3 min, move on and return',
        ],
      },
    ],
  },
  {
    id: 'di',
    label: 'Data Interpretation',
    icon: BarChart2,
    color: { tab: 'amber', accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30', active: 'bg-amber-600 dark:bg-amber-500' },
    topics: [
      {
        name: 'Bar Charts',
        formulas: [
          'Value = read off Y-axis for each bar',
          'Growth % = (Current − Previous) / Previous × 100',
          'Ratio = Value A / Value B',
          'Difference = read values and subtract',
        ],
        approach: [
          'Read X-axis (categories) and Y-axis (unit/scale) before answering',
          'Note the scale carefully — bars may represent thousands or millions',
          'For grouped bar charts, distinguish each group by colour/pattern',
          'Estimate values visually when precision is not critical',
        ],
        tips: [
          'Round values to nearest 5 or 10 for faster estimation',
          'Maximum/minimum bar = highest/lowest bar visually',
          'For "total" questions, add all bars for that category',
          'Always check if Y-axis starts at 0 (truncated axis inflates differences)',
        ],
      },
      {
        name: 'Line Graphs',
        formulas: [
          'Growth rate = (y2 − y1) / y1 × 100',
          'Average = Sum of all values / Number of points',
          'Slope indicates rate of change',
        ],
        approach: [
          'Identify trends: increasing, decreasing, fluctuating',
          'For rate of change: steeper slope = faster change',
          'Compare multiple lines by looking at intersection points',
          'For "highest growth" questions — identify the steepest upward segment',
        ],
        tips: [
          'Downward slope = decline; flat = no change; upward = growth',
          'Highest point ≠ highest growth (relative change matters)',
          '"Maximum fall" = segment where value dropped most in absolute terms',
          'Intersection of two lines = equal values for both at that point',
        ],
      },
      {
        name: 'Pie Charts',
        formulas: [
          'Value of a sector = (Angle / 360) × Total',
          'Value of a sector = (% / 100) × Total',
          'Ratio of two sectors = ratio of their angles or percentages',
          'Angle of a sector = (Value / Total) × 360°',
        ],
        approach: [
          'The total (100% or 360°) is always given or derivable',
          'For value questions: convert % → absolute using given total',
          'For ratio questions: directly use the percentages (total cancels)',
          'Two pie charts (different totals): don\'t compare % directly',
        ],
        tips: [
          'If total is not given, ratios and %s are enough for many questions',
          'Don\'t add percentages from two separate pie charts to get a combined %',
          '90° sector = 25% of total; 180° = 50%; 120° = 33.3%',
          'For "difference in value" questions you always need the total',
        ],
      },
      {
        name: 'Tables',
        formulas: [
          'Row total / Column total / Grand total as required',
          'Percentage share = (Cell value / Row or Column total) × 100',
          'Growth % between rows = (Row2 − Row1) / Row1 × 100',
        ],
        approach: [
          'Scan entire table briefly: understand rows, columns, and units',
          'Identify which cells are needed for each question — don\'t read all',
          'For "maximum in a row/column" — visually scan that row/column',
          'For ratio/proportion questions: pick only the two relevant cells',
        ],
        tips: [
          'Missing values are often derivable from row/column totals',
          'Approximate: if 487/2301 ≈ 490/2300 ≈ 21%, close enough',
          'Rank questions: sort mentally — no calculation needed',
          'Units: make sure both cells use same unit before comparing',
        ],
      },
      {
        name: 'Caselets (Text-based DI)',
        formulas: [
          'Extract all numbers and their units into a table first',
          'Derived values: compute once and reuse',
        ],
        approach: [
          'Read the passage fully once before answering',
          'Create a mini table of all entities and values as you read',
          'Note relationships (twice as much, 30% more, etc.) as equations',
          'Solve derived equations before jumping to the questions',
        ],
        tips: [
          'Most of the time 2–3 key figures unlock all 5 questions',
          'Highlight "%" vs "percentage points" difference (3%→5% = +2pp, +66.7%)',
          'Label clearly: absolute vs relative values',
          'Work top-down: higher-level totals → sub-components',
        ],
      },
      {
        name: 'Mixed / Combination DI',
        formulas: [
          'Use the relevant formula for each chart type within the set',
        ],
        approach: [
          'Each chart provides a subset of information — combine across charts',
          'Cross-reference: value from pie chart may be the total for the bar chart',
          'Identify which chart answers which part of the question',
          'Solve simpler single-chart questions first to build baseline values',
        ],
        tips: [
          'Linked data: total in one chart = denominator for another',
          'Check if charts refer to same time period or different periods',
          'Don\'t mix values from mismatched years/categories across charts',
          'Draw a small note of "what each chart tells you" before starting',
        ],
      },
    ],
  },
];

/* ─── Reusable card ─────────────────────────────────────────── */
const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';

/* ─── Section for each content block inside a topic ──────────── */
function ContentBlock({ icon: Icon, title, items, accent }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent.bg}`}>
          <Icon size={14} className={accent.accent} />
        </div>
        <h3 className="text-[13.5px] font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${accent.active}`} />
            <span className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function Prerequisites() {
  const [activeSectionId, setActiveSectionId] = useState('quant');
  const [activeTopic, setActiveTopic] = useState(SECTIONS[0].topics[0]);

  const section = SECTIONS.find(s => s.id === activeSectionId);
  const c = section.color;

  const handleSectionChange = (id) => {
    setActiveSectionId(id);
    setActiveTopic(SECTIONS.find(s => s.id === id).topics[0]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top header + category tabs ── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-0">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
            <BookOpen size={16} className="text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-slate-900 dark:text-white">Prerequisites</h1>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">Formulas, approach & tips for every topic</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
          {SECTIONS.map(sec => {
            const Icon = sec.icon;
            const active = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => handleSectionChange(sec.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[12.5px] font-semibold transition-all ${
                  active
                    ? `bg-white dark:bg-[#0e0e15] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]`
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={13} className={active ? sec.color.accent : ''} />
                <span className="hidden sm:inline">{sec.label}</span>
                <span className="sm:hidden">{sec.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two-panel body ── */}
      <div className="flex flex-1 overflow-hidden gap-4 px-6 py-4">

        {/* Left: topic list */}
        <div className={`w-56 flex-shrink-0 overflow-y-auto ${CARD} p-2`}>
          {section.topics.map(topic => {
            const active = activeTopic?.name === topic.name;
            return (
              <button
                key={topic.name}
                onClick={() => setActiveTopic(topic)}
                className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-[13px] font-medium ${
                  active
                    ? `${c.bg} ${c.accent} font-semibold`
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span className="truncate">{topic.name}</span>
                {active && <ChevronRight size={13} className={`flex-shrink-0 ${c.accent}`} />}
              </button>
            );
          })}
        </div>

        {/* Right: topic detail */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {activeTopic && (
            <>
              {/* Topic header */}
              <div className={`${CARD} px-5 py-4 flex items-center gap-3`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                  <section.icon size={18} className={c.accent} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">{activeTopic.name}</h2>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                    {section.label}
                  </span>
                </div>
              </div>

              <ContentBlock
                icon={Hash}
                title="Formulas"
                items={activeTopic.formulas}
                accent={c}
              />
              <ContentBlock
                icon={Zap}
                title="How to Approach"
                items={activeTopic.approach}
                accent={c}
              />
              <ContentBlock
                icon={Lightbulb}
                title="Tips & Tricks"
                items={activeTopic.tips}
                accent={c}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
