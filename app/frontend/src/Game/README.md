## How AI opponent work?
1. Game Loop calls AI.update() every frame
2. AI decides if it needs to recalculate (throttling)
3. AI predicts ball trajectory (physics simulation)
4. AI adjusts strategy based on game state
5. AI calculates target position
6. AI determines paddle movement direction
7. Paddle moves via simulated keyboard input


Frame N
   ↓
[AI.update() called with ball/paddle data]
   ↓
[Check: Has 1 second passed?]
   ↓                    ↓
  NO                   YES
   ↓                    ↓
[Use old target]   [Full recalculation]
+ random drift          ↓
   ↓              [Determine strategy: balanced/defensive/aggressive]
   ↓                    ↓
   ↓              [Check power-up priority]
   ↓                    ↓
   ↓              [Predict ball trajectory via physics simulation]
   ↓                    ↓
   ↓              [Store prediction: Y = 616]
   ↓                    ↓
   ↓              [Calculate confidence: 0.85]
   ↓                    ↓
   ↓              [Apply strategy adjustments]
   ↓                    ↓
   └────────────→ [Calculate movement direction]
                       ↓
                  [Compare paddle center (325) vs target (616)]
                       ↓
                  [Distance = 291 > threshold (27)]
                       ↓
                  [Return: shouldMoveDown = true]
                       ↓
                  [Simulate keyboard: arrowdown = true]
                       ↓
                  [Move paddle: y += 6]
                       ↓
                  [Paddle moves from 280 → 286]
                       ↓
                  [Next frame repeats...]