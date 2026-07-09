## Halcyon

## Group Number: 6B

## Description
This is a game that explores the nature of bipolar disability through a fantasy world. Players navigate a shifting world through involuntary transformations, requiring the players to adapt through a turbulent cycle.
The core mechanics of the game is the involuntary state changes, the hazards, and the objectives. The players are forced to cycle through the different physical forms throughout the gameplay, adapting to each state. The hazards are placed around the map depending on the state the player is in, creating failure states.The objectives centralize the player in their exploration of the fantasy world, creating a clear path.
The player goes through an emotional loop where they face tension vs. release. The bird form sparks high adrenaline anxiety and requires intense focus, whereas the fish requires patience, and methodical calculation compared to the bird.

## Design Rationale 

**Involuntary State-shifting**

2D Human form
- An upright posture with 2 distinct legs and a grounded stance implies a familiar baseline of control where the player is bound to the floor unless actively jumping

Bird Form
- The visual cue of wings, and lack of contact with the ground implies airborn mobility and high velocity
- The wind current into the transition from the player to the bird indicates that the player will be exploring with a mechanic that does not involve being on the ground.

Fish Form
- The visual cue of the character turning into a fish and the sudden drop in movement speed implies gravity-driven sinking
- The stamina bar that appeared beside the fish implies that the fish would eventually run out of energy, needing time to recharge (it is much easier to sink than rise, mirroring depressive feelings).

How GameFlow principles support learning and engagement:
- Concentration: The game maintains engagement through structured pacing, matching each rune with an obviously corresponding gate 
- Challenge: The player needs to learn different mechanics in different situations of navigating obstacles to acquire runes
- Player Skill: There is space for players to play around with/practice the mechanic of their form before advancing to harder areas. Obstacles start off simple and increase in difficulty throughout the level (e.g. spike frequency, parkour difficulty). 
- Control: WASD
- Clear goals: There has always been one goal (which is to collect all the runes and go through the portal). Each segment of the map is barred off until its corresponding rune is picked up, eliminating potential for players diverging from the goal.
- Feedback: Each time the player collects a rune, the rune counter will increase visibly towards a total rune count, an audible chime is played, and the area's barrier disappears, indicating that the player is making progress
- Immersion: sound and visuals work together to create an immersive fantasy environment, changing to emphasise differences between states.

How the disability is integrated into the design:

We integrated the disability (bipolar) into the core mechanics of the game. By forcing the player through state changes, they must navigate that state's altered movement that mimics different mindstates of the disability, in inconvenient environments that seem to work against them. 
- The jarringly fast bird speed simulates how people with BPD have to constantly adjust to societal environments that weren't designed with them in mind, and how they can't simply force themselves to slow down.
- The fish's constant sinking pressure, diminishing stamina, and high-located objectives simulate how people with BPD are expected to fulfill high-performance societal responsibilities, regardless of their mental state. Instead of being able to overpower the constant sinking, players must strategically compensate by using momentum and resting spots in order to travel upwards.

## Setup and Interaction Instructions
(How to run and play the game)
To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:**
- Move: WASD
- A and D to move left right
- D to move down
- W to jump/flap/swim up

**Opening the Chrome Console**
- **Windows:** Press `F12` or `Ctrl + Shift + J`, then click the **Console** tab
- **Mac:** Press `Cmd + Option + J`

## Iteration Notes
Post-Playtest: 3 changes made based on playtesting
1. Decreased map size and openness to define the expected path
2. Redesigned fish movement mechanics to be more intentional and able to be strategized around
3. Coordinated rune collection with barrier-opening to further direct players along the map and prevent them from progressing without collecting all the runes / straying from the goal

Post-Showcase 2 planned improvements:
1. At the beginning area, don't kill the player when they fall. Instead, provide a more forgiving way to climb back up to try the jumps again.
2. Put a glow or animation on the checkpoint flags so it indicates that its a significant game element rather than part of the background.

## Assets

| File                     | Source.    |
|--------------------------|------------|
| `assets/images/bark.png` | Hanna Park |
| `assets/images/bgrock.png` | Hanna Park |
| `assets/images/bird.png` | Janelle Lai |
| `assets/images/bridge.png` | Hanna Park |
| `assets/images/cavebg.png` | Hanna Park |
| `assets/images/endareabg.png` | Hanna Park |
| `assets/images/fish.png` | Janelle Lai |
| `assets/images/fishareaBG.png` | Hanna Park |
| `assets/images/fishareaoverlay.png` | Hanna Park |
| `assets/images/flag.png` | Hanna Park |
| `assets/images/grass.png` | Hanna Park |
| `assets/images/ground.png` | Hanna Park |
| `assets/images/human.png` | Janelle Lai |
| `assets/images/Level1Message.png` | Hanna Park |
| `assets/images/portalclosed.png` | Hanna Park |
| `assets/images/portalopen.png` | Hanna Park |
| `assets/images/rock.png` | Hanna Park |
| `assets/images/rune.png` | Janelle Lai |
| `assets/images/runes.png` | Janelle Lai |
| `assets/images/sand.png` | Hanna Park |
| `assets/images/sandrock.png` | Hanna Park |
| `assets/images/seaweed.png` | Hanna Park |
| `assets/images/spike1.png` | Hanna Park |
| `assets/images/spike2.png` | Hanna Park |
| `assets/images/spike3.png` | Hanna Park |
| `assets/images/spike4.png` | Hanna Park |
| `assets/images/startbg.png` | Hanna Park |
| `assets/images/Title frame1.png` | Hanna Park |
| `assets/images/Title frame2.png` | Hanna Park |
| `assets/images/watersuface.png` | Hanna Park |
| `assets/images/whirlpool.png` | Janelle Lai |
| `assets/images/wind.png` | Janelle Lai |
| `assets/sounds/flappingsound` [1]| free sound community, wingflap_fast-2— Pixabay.com  
| `assets/sounds/diesound` [2]| Sound shelf studio, UI loading end fail — Pixabay.com  
| `assets/sounds/walkingsound` [3]| Joentnt, Walk on grass 3 — Pixabay.com |
| `assets/sounds/runesound` [4]| Liecio, Diamond found— Pixabay.com |
| `assets/sounds/fishareasound` [5]| DRAGON STUDIO, Underwater ambience — Pixabay.com |
| `assets/sounds/humanBGound` [6]| Nakarada, Adventure | Royalty Free Medieval Fantasy Music — Youtube.com  |
| `assets/sounds/birdBGsound` [7]| BreakingCopyright — Royalty Free Music, Epic Battle Music (No Copyright) "Dragon Castle" by Makai-symphony — Youtube.com  |

## References

[1] Free Sound Community. n.d. Wingflap_fast-2. Pixabay. Retrieved July 7, 2026 from https://pixabay.com/sound-effects/nature-wingflap-fast-2-77739/

[2] Sound Shelf Studio. n.d. UI Loading End Fail. Pixabay. Retrieved July 7, 2026 from https://pixabay.com/sound-effects/film-special-effects-ui-loading-end-fail-522858/

[3] Joentnt. n.d. Walk on Grass 3. Pixabay. Retrieved July 7, 2026 from https://pixabay.com/sound-effects/film-special-effects-walk-on-grass-3-291986/

[4] Liecio. n.d. Diamond Found. Pixabay. Retrieved July 7, 2026 from https://pixabay.com/sound-effects/film-special-effects-diamond-found-190255/

[5] DRAGON-STUDIO. n.d. Underwater Ambience. Pixabay. Retrieved July 7, 2026 from https://pixabay.com/sound-effects/nature-underwater-ambience-376890/

[6] Nakarada. 2020. Adventure | Royalty Free Medieval Fantasy Music. YouTube. Retrieved July 7, 2026 from https://www.youtube.com/watch?v=7_cwKd81z7Q

[7] BreakingCopyright — Royalty Free Music. 2018. Epic Battle Music (No Copyright) "Dragon Castle" by Makai-symphony. YouTube. Retrieved July 7, 2026 from https://www.youtube.com/watch?v=9gBTKiVqprE


