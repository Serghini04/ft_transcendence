/**
 * SYNTAX EXAMPLES - Understanding Advanced TypeScript/React Patterns
 * 
 * This file contains practical examples of the syntax patterns used in TicTacGame.tsx
 * For detailed explanation, see SYNTAX_EXPLANATION.md
 */

// ============================================================================
// EXAMPLE 1: The Complete Pattern (from TicTacGame.tsx line 59)
// ============================================================================

interface Scores {
  X: number;
  O: number;
  draws: number;
}

// Scenario: Player X wins, we need to increment X's score
const board = ["X", "X", "X", "", "O", "", "", "O", ""]; // X wins in first row
const a = 0; // Index of first winning position

// Current state
const currentScores: Scores = { X: 2, O: 3, draws: 1 };

// The syntax in question:
// setScores(prev => ({ ...prev, [board[a]]: prev[board[a] as 'X' | 'O'] + 1 }))

// Let's break it down step by step:
const winner = board[a]; // "X"
const newScores = {
  ...currentScores,                    // { X: 2, O: 3, draws: 1 }
  [winner]: currentScores[winner as 'X' | 'O'] + 1  // X: 3
};
// Result: { X: 3, O: 3, draws: 1 }

// ============================================================================
// EXAMPLE 2: Spread Operator - Copying Objects
// ============================================================================

const originalScores = { X: 5, O: 3, draws: 2 };

// Without spread - creates reference (BAD for React state)
const reference = originalScores;
reference.X = 10; // This also changes originalScores!

// With spread - creates new object (GOOD for React state)
const copiedScores = { ...originalScores };
copiedScores.X = 10; // originalScores is unchanged

console.log('Original:', originalScores); // { X: 5, O: 3, draws: 2 }
console.log('Copied:', copiedScores);     // { X: 10, O: 3, draws: 2 }

// ============================================================================
// EXAMPLE 3: Computed Property Names - Dynamic Keys
// ============================================================================

// Static property names (traditional way)
const staticObject = {
  X: 1,
  O: 2
};

// Computed property names (dynamic way)
const playerSymbol = "X";
const computedObject = {
  [playerSymbol]: 1  // Property name is determined at runtime
};
// Result: { X: 1 }

// Another example with variables
const key1 = "player1Score";
const key2 = "player2Score";
const gameScores = {
  [key1]: 100,
  [key2]: 85
};
// Result: { player1Score: 100, player2Score: 85 }

// ============================================================================
// EXAMPLE 4: Type Assertions - Helping TypeScript
// ============================================================================

interface GameScores {
  X: number;
  O: number;
}

const scores: GameScores = { X: 5, O: 3 };

// Without type assertion - TypeScript error
// const symbol: string = "X";
// const score = scores[symbol]; // ERROR: string is not assignable to 'X' | 'O'

// With type assertion - TypeScript is happy
const symbol: string = "X";
const score = scores[symbol as 'X' | 'O']; // OK! We're telling TS it's definitely 'X' or 'O'

// ============================================================================
// EXAMPLE 5: Complete Real-World Scenario
// ============================================================================

/**
 * Simulates updating the score when a player wins
 */
function updateScoreExample() {
  // Game state
  let scores = { X: 5, O: 7, draws: 2 };
  const board = ["O", "", "X", "O", "X", "", "O", "", "X"];
  const winningCombination = [0, 3, 6]; // First column
  
  // Check if there's a winner
  const [a, b, c] = winningCombination;
  if (board[a] && board[a] === board[b] && board[a] === board[c]) {
    console.log(`Winner: ${board[a]}`);
    
    // Method 1: The original syntax (concise)
    scores = { ...scores, [board[a]]: scores[board[a] as 'X' | 'O'] + 1 };
    
    // Method 2: More verbose but clearer
    // const winner = board[a] as 'X' | 'O';
    // const currentScore = scores[winner];
    // scores = { ...scores, [winner]: currentScore + 1 };
    
    console.log('Updated scores:', scores);
  }
}

// ============================================================================
// EXAMPLE 6: Alternative Implementations
// ============================================================================

/**
 * Different ways to update the score (all achieve the same result)
 */
function alternativeApproaches(board: string[], winnerIndex: number, currentScores: Scores): Scores {
  const winner = board[winnerIndex];
  
  // Approach 1: Original (most concise)
  return { ...currentScores, [winner]: currentScores[winner as 'X' | 'O'] + 1 };
  
  // Approach 2: With intermediate variable
  // const winnerSymbol = winner as 'X' | 'O';
  // return { ...currentScores, [winnerSymbol]: currentScores[winnerSymbol] + 1 };
  
  // Approach 3: Conditional
  // return {
  //   ...currentScores,
  //   X: winner === 'X' ? currentScores.X + 1 : currentScores.X,
  //   O: winner === 'O' ? currentScores.O + 1 : currentScores.O
  // };
  
  // Approach 4: Imperative (not recommended for React)
  // const newScores = { ...currentScores };
  // if (winner === 'X') newScores.X++;
  // else if (winner === 'O') newScores.O++;
  // return newScores;
}

// ============================================================================
// EXAMPLE 7: React setState Pattern
// ============================================================================

/**
 * Why we use the function form of setState
 */
function reactStateUpdateExample() {
  // Assume we have: const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  
  // ❌ BAD: Direct state update (doesn't guarantee latest state)
  // setScores({ ...scores, X: scores.X + 1 });
  
  // ✅ GOOD: Function form (guarantees latest state)
  // setScores(prev => ({ ...prev, X: prev.X + 1 }));
  
  // This is especially important when:
  // 1. Multiple state updates happen quickly
  // 2. Updates depend on previous state
  // 3. In async operations or callbacks
}

// ============================================================================
// QUICK REFERENCE TABLE
// ============================================================================

/*
┌─────────────────────────┬─────────────────────────┬────────────────────────────┐
│ Pattern                 │ Syntax                  │ Purpose                    │
├─────────────────────────┼─────────────────────────┼────────────────────────────┤
│ Spread Operator         │ { ...obj }              │ Copy object properties     │
│ Computed Property       │ { [key]: value }        │ Dynamic property names     │
│ Type Assertion          │ value as Type           │ Tell TypeScript the type   │
│ Function setState       │ setState(prev => {})    │ Update based on prev state │
│ Property Access         │ obj[key]                │ Get value by key           │
└─────────────────────────┴─────────────────────────┴────────────────────────────┘
*/

// ============================================================================
// EXERCISES
// ============================================================================

/**
 * Try these exercises to test your understanding:
 */

// Exercise 1: Update player O's score
function exercise1() {
  const scores = { X: 3, O: 2, draws: 1 };
  const board = ["O", "O", "O", "", "", "", "", "", ""];
  const a = 0;
  
  // TODO: Write the score update logic here
  // const newScores = ???
}

// Exercise 2: Add a new property dynamically
function exercise2() {
  const stats = { wins: 10, losses: 5 };
  const newStatKey = "draws";
  const newStatValue = 3;
  
  // TODO: Create a new object with the new property
  // const updatedStats = ???
}

// Exercise 3: Update multiple properties at once
function exercise3() {
  const scores = { X: 5, O: 5, draws: 2 };
  
  // TODO: Increment both X and draws by 1
  // const newScores = ???
}

// ============================================================================
// SOLUTIONS
// ============================================================================

// Solution 1:
// const newScores = { ...scores, [board[a]]: scores[board[a] as 'X' | 'O'] + 1 };
// Result: { X: 3, O: 3, draws: 1 }

// Solution 2:
// const updatedStats = { ...stats, [newStatKey]: newStatValue };
// Result: { wins: 10, losses: 5, draws: 3 }

// Solution 3:
// const newScores = { ...scores, X: scores.X + 1, draws: scores.draws + 1 };
// Result: { X: 6, O: 5, draws: 3 }

export {};
