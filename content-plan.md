# Content plan: the Second Golden Record

This plan reshapes the voyage's text content into a story. Visitors should want to read it, it should match the body on screen, and it should show real achievements. The decisions were settled in a `/grill-me` session on 2026-11-19. The evidence behind them is in `reports/Space tour portfolio storytelling.md`, with research notes in `research_notes/Space tour portfolio storytelling/`.

Nothing in this file is code. Each milestone at the end becomes one OpenSpec change, built test-first.

---

## 1. The problem

- **The scene beats the text.** The card docks to the side while Voyager orbits the body, so the eye stays on the motion. The card also closes on a timer (2.5 s after the typing ends), not when the visitor has finished reading.
- **The cards ignore their bodies.** Only 3 of 27 cards (Jupiter, Saturn, Heliopause) have anything to do with the body they sit at. The rest read the same in front of any planet.
- **Some bodies are false astronomy.** Voyager 1 never came near Mars, its moons, Ceres, Vesta, Pallas, Hygiea, Pluto, Charon, Arrokoth or Eris. Its only planetary encounters were the Jupiter and Saturn systems.
- **The cards describe products, not achievements.** No card has an outcome or a number. Five end with the hedge "I work on it with the team".
- **27 cards at one pace make a conveyor belt.** 80% of recruiters give a portfolio 3 minutes or less, so most never reach stop 19.

## 2. The concept

> **Voyager 1 carries two records.** One is Earth's Golden Record. The other, on this voyage, holds 9 years of one engineer: Sajeeb Ahamed. Voyager plays a track at each chapter of the route.

- **Narrator.** Voyager 1, in the first person. Its tone is calm, wry and precise, like an old engineer's logbook: short declarative lines, real facts, and one dry twist per card.
- **Throughline.** The record. Each chapter is a _track_, and the HUD's track list is the _record sleeve_. At the finale the record ends and Voyager asks the visitor to send a signal back.
- **Honesty rule.** Voyager never claims a flyby that did not happen. At bodies it never visited, it says so ("I never came near Charon…") and then tells a true moment from its mission. Every mission fact is sourced (§9).
- **Facts first, flavour second.** The narration is the story. A plain **TRACK DATA** block underneath holds the facts, so a skimmer gets them in seconds.
- **Pronouns.** The narration refers to the owner by name ("Sajeeb") or as "this engineer", and avoids pronouns. **Owner to decide:** whether Voyager should use a pronoun for you, and which one.

## 3. Structure: 3 acts, 11 chapters, 16 flybys

The 3D path and the bodies stay as they are. Only **chapters** stop Voyager and open a card. Every other body is a **flyby**: a one-line label shown as Voyager passes, with no stop. ★ marks a **hero story**, which has an expandable full track and needs one real number.

| #   | Act             | Body                      | Mission moment (sourced)                                                                                     | Career content                                                       |
| --- | --------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | I · Launch      | Earth                     | Launched second, 16 days after its twin, and still reached Jupiter four months earlier                       | Who I am: VP of Engineering, 9 years                                 |
| 2   | I               | Moon                      | Two weeks out, the first single-frame photo of Earth and the Moon together                                   | The first look back: career timeline                                 |
| 3★  | I               | Ceres (flashback)         | Crossing the asteroid belt, Dec 1977 to Sept 1978: nine quiet months of steady flight                        | The JoomShaper years: Helix Ultimate v2 and SP Page Builder v5       |
| 4   | II · Grand Tour | Jupiter                   | Gravity assist (5 Mar 1979): Jupiter bent the path and flung Voyager toward Saturn                           | Ollyo: VP of Engineering; platforms as leverage                      |
| 5★  | II              | Ganymede                  | Largest moon in the solar system                                                                             | Growfund and Kirki eCommerce: the biggest builds, architecture first |
| 6★  | II              | Io                        | First active volcanoes beyond Earth, found by a navigation engineer in a photo taken to steer the spacecraft | Druti, a side project from off the main mission                      |
| 7★  | II              | Saturn                    | Rings made of thousands of ringlets                                                                          | Open-source libraries                                                |
| 8★  | II              | Support comet (flashback) | Comets are not on Voyager's route: brief, bright visitors                                                    | The AI agent prototypes (support and recruiter)                      |
| 9   | III · The Edge  | Charon (flashback)        | The 2024 remote memory patch: 3% of memory corrupted, a 22.5-hour one-way delay                              | AI-native, spec-first, test-first workflow                           |
| 10  | III             | Eris (flashback)          | The Golden Record: written for a reader who shares none of our context                                       | Teaching and mentoring                                               |
| —   | III             | _Breath_                  | Termination shock, 16 Dec 2004, about 94 AU. No card, telemetry only                                         | —                                                                    |
| 11★ | III             | Heliopause                | Crossed 25 Aug 2012, confirmed only in 2013 after a solar storm made the plasma "ring"                       | Leadership and the Ollyocon keynote                                  |
| ∞   | Finale          | Pale Blue Dot             | 14 Feb 1990, about 6 billion km from the Sun; then the cameras were switched off                             | The record ends: send a signal back (contact)                        |

Hero stories (6): Helix/SPPB, Growfund/Kirki, Druti, open source, AI agents, leadership and keynote.

### Flyby labels

A flyby label shows the body name plus one line: a project with its link, or a real fact if the body has no project. The order roughly follows the career timeline.

| Body            | Label                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Mars            | `MARS · 2017 · First job: Laravel & Vue.js developer at Ezzytech`                                |
| Phobos          | `PHOBOS · 2018 · Joined JoomShaper to build Joomla core products`                                |
| Deimos          | Fact only ⟨source a Deimos fact, or reuse "Voyager 1 never visited Mars"⟩                        |
| Vesta           | Fact only ⟨sourced asteroid fact⟩                                                                |
| Pallas          | Fact only ⟨sourced asteroid fact⟩                                                                |
| Hygiea          | `HYGIEA · 2022 · Remote frontend engineer with a team in Lithuania (Corner Case)` ⟨VERIFY dates⟩ |
| Europa          | `EUROPA · Omnis — the shared plugin core under every Ollyo product` (private, no link)           |
| Callisto        | `CALLISTO · Talos — background jobs for WordPress, running out of sight` (private, no link)      |
| Titan           | `TITAN · JsPhp — JavaScript-style array methods for PHP ↗`                                       |
| Rhea            | `RHEA · treeSortable — drag-and-drop nested lists ↗`                                             |
| Iapetus         | `IAPETUS · jext-cli — scaffolds Joomla 4 components ↗`                                           |
| Enceladus       | `ENCELADUS · Close Tabs to Left — a small VS Code fix ↗`                                         |
| Recruiter comet | `COMET · AI recruiter agent — scores applications 1–5 with evidence`                             |
| Upcoming comet  | `COMET · Coming up: a keyboard-first prescription app for doctors`                               |
| Pluto           | `PLUTO · Never visited. The stack that stays powered: PHP · TypeScript · React · Rust`           |
| Arrokoth        | `ARROKOTH · Exploring: MCP servers for PHP plugins, Shadow DOM widgets, Rust`                    |

EasyStore/StoreSync, Tutor LMS and themeum/framework move into the TRACK DATA of Jupiter (§5.4) and Ganymede (§5.5). No content is dropped: text mode lists everything.

## 4. Anatomy of a chapter card

```
VOYAGER 1 // TRACK 06 · IO · MAR 1979        ← header line (the only typed line)
Io's volcanoes, the first active ones found
beyond Earth, weren't spotted by the science   ← narration, Voyager speaking
team. A navigation engineer found them …          ~30 words (hub cards up to ~50)
── TRACK DATA ──                               ← plain facts, scannable
What    Druti · phonetic Bengali keyboard
Role    Author
Impact  ⟨VERIFY number⟩
Stack   Rust · Swift · UniFFI · WebAssembly
[▶ Play full track]   [Try it ↗]               ← hero cards only
NEXT TRACK · SATURN — thousands of rings, one idea each.   ← teaser
```

- **Word budget.** About 30 words of narration on moon and comet chapters, and up to about 50 on hubs (Earth, Moon, Jupiter, Heliopause). Track data stays at 3–5 short rows.
- **TRACK DATA rows.** What · Role · Impact (the hero number) · Years · Stack · Links. A row with nothing to say is left out.
- **▶ Play full track** (heroes only). Expands the same card in place by about 120 words, one level deep: **Challenge → Action → Twist (including the option you rejected) → Proof link.** While it is open, Voyager holds and scrolling does not move the voyage.
- **NEXT TRACK teaser.** One line that opens a small curiosity gap about the next chapter.

## 5. Draft copy for each chapter

These drafts are for review. ⟨VERIFY⟩ marks facts or numbers only the owner can supply; nothing ships with an empty slot. Mission facts are sourced in §9.

### 5.1 Track 01 · Earth · SEP 1977

**Narration.** I launched second, sixteen days after my twin, and still reached Jupiter first. I carry two records. One holds the sounds of Earth. The other holds nine years of one engineer: Sajeeb Ahamed. Track one.
**Track data.** VP of Engineering, Ollyo · 9 years · Leads the teams behind Ollyo's WordPress and Joomla products · GitHub ↗ · LinkedIn ↗
**Teaser.** NEXT TRACK · MOON — the first look back.
_The control instructions ("scroll, swipe…") leave the card. The boot hint and the first open-and-close cycle teach the controls instead._

### 5.2 Track 02 · Moon · SEP 1977

**Narration.** Two weeks out, I turned around and caught Earth and the Moon in a single frame, a first. Every record starts by looking back at where it began.
**Track data.** Timeline: Ezzytech, Laravel & Vue.js (2017) → JoomShaper, Joomla core products (2018–2022) → Corner Case, remote frontend (2022 ⟨VERIFY⟩) → Ollyo, VP of Engineering (2022 ⟨VERIFY⟩–now).
**Teaser.** NEXT TRACK · THE BELT — nine quiet months that shipped.

### 5.3 Track 03 ★ · Ceres · 1977–78

**Narration.** I never came near Ceres. I crossed the belt between December 1977 and September 1978: nine months with no headlines, just steady flight. From outside, Sajeeb's JoomShaper years looked like that. From inside, they shipped.
**Track data.** Helix Ultimate v2: led ⟨VERIFY wording⟩ · SP Page Builder v5: led ⟨VERIFY wording⟩ · JoomShaper 2018–2022 · Impact ⟨VERIFY number⟩ · Helix on GitHub ↗
**Full track.**

- _Challenge:_ carry long-lived Joomla products to a new major version without breaking the sites already built on them ⟨VERIFY framing⟩.
- _Action:_ ⟨owner⟩.
- _Twist:_ ⟨owner: the option you rejected⟩.
- _Proof:_ Helix repo.

**Teaser.** NEXT TRACK · JUPITER — the planet that throws you forward.

### 5.4 Track 04 · Jupiter · MAR 1979

**Narration.** Jupiter didn't stop me. Its gravity bent my path and threw me toward Saturn, faster than I arrived. Good platforms do that for every product that passes them. At Ollyo, building them is Sajeeb's job.
**Track data.** Ollyo · VP of Engineering · 2022 ⟨VERIFY⟩–now · Platforms: Omnis (shared plugin core), Talos (background jobs) · Products: EasyStore and StoreSync, Tutor LMS, Growfund, Kirki · Built with Ollyo's teams.
**Teaser.** NEXT TRACK · GANYMEDE — the biggest builds.

### 5.5 Track 05 ★ · Ganymede · MAR 1979

**Narration.** Ganymede is the largest moon in the solar system, bigger than the planet Mercury. Big things need a frame to hold them. Sajeeb builds that way: the architecture first, the features second.
**Track data.** Growfund: architect · crowdfunding and donations for WordPress · React 19 admin on a custom DI container, DTOs, query builder on wpdb · Kirki eCommerce: Laravel-style MVC on themeum/framework, Stripe, released Aug 2026 ⟨VERIFY⟩, role ⟨VERIFY⟩ · Impact ⟨VERIFY number⟩ · Growfund ↗ · Kirki ↗ · framework ↗
**Full track.**

- _Challenge:_ WordPress plugins tend to grow as unstructured hooks ⟨VERIFY framing⟩.
- _Action:_ a DI container, DTOs and a query builder before the first feature.
- _Twist:_ ⟨owner⟩.
- _Proof:_ repos.

**Teaser.** NEXT TRACK · IO — the volcano nobody was looking for.

### 5.6 Track 06 ★ · Io · MAR 1979

**Narration.** Io's volcanoes, the first active ones found beyond Earth, weren't spotted by the science team. A navigation engineer found them in a photo taken only to steer me. Sajeeb's favourite project also started off the main mission.
**Track data.** Druti · phonetic Bengali keyboard · "ami banglay gan gai" → "আমি বাংলায় গান গাই" · Rust engine, native macOS and iOS keyboards, WebAssembly playground · Impact ⟨VERIFY number⟩ · GitHub ↗ · Try it ↗ ⟨VERIFY: is the playground public?⟩
**Full track.**

- _Challenge:_ typing Bengali on a Latin keyboard ⟨owner: why existing tools fell short⟩.
- _Action:_ one Rust engine shared by macOS, iOS and the web through UniFFI and WASM.
- _Twist:_ ⟨owner⟩.
- _Proof:_ the playground.

**Teaser.** NEXT TRACK · SATURN — thousands of rings, one idea each.

### 5.7 Track 07 ★ · Saturn · NOV 1980

**Narration.** From far off, Saturn's rings look like one. Up close they are thousands of ringlets. Sajeeb's open source is built the same way: small, focused libraries, each fixing a problem met at work.
**Track data.** JsPhp · treeSortable · jext-cli · Close Tabs to Left · Impact ⟨VERIFY: total stars, downloads or installs⟩ · GitHub ↗ (the moons that follow carry one library each)
**Full track.** Pick the library with the best story ⟨owner⟩: the problem, the smallest fix that worked, and who uses it now.
**Teaser.** NEXT TRACK · A COMET — something new, still burning bright.

### 5.8 Track 08 ★ · Support comet

**Narration.** Comets aren't on my route. They fall in from the dark, burn bright for a while, and few of them stay. Sajeeb's AI agents are like that for now: working prototypes, not yet in orbit.
**Track data.** Support agent: answers how-to questions from the docs (RAG over LanceDB) and behaviour questions by searching the plugin's source · Recruiter agent: scores applications 1–5 in batches of five, with evidence and anti-bias checks ⟨VERIFY built⟩ · Status: prototypes · Impact ⟨VERIFY: e.g. share of test questions answered correctly⟩
**Full track.**

- _Challenge:_ docs answer "how", but only the code answers "why does it do that".
- _Action:_ two retrieval paths behind one agent.
- _Twist:_ ⟨owner⟩.

**Teaser.** NEXT TRACK · CHARON — a patch sent 24 billion km.

### 5.9 Track 09 · Charon · APR 2024 (flashback)

**Narration.** I never came near Charon. But in 2024, a worn-out chip corrupted 3% of my memory. Engineers split the fix into pieces and sent it on a 22.5-hour trip. Every command had to be right first time. Sajeeb builds that way too.
**Track data.** Spec-first: every change starts as an OpenSpec proposal · Test-first: red → green → refactor · One Claude Code session per change, on its own Git branch · This site was built that way ⟨VERIFY: link the repo if public⟩
**Teaser.** NEXT TRACK · ERIS — a message for someone you'll never meet.

### 5.10 Track 10 · Eris (flashback)

**Narration.** I never came near Eris. What I carry is a record whose playing instructions are written in physics, for a listener who shares none of our languages. Teaching beginners is the same job: start from zero context.
**Track data.** Teaches HTML, CSS, Tailwind CSS, JavaScript, React and React Router · Designs hands-on practical exams, like a two-hour React e-commerce build · ⟨VERIFY: number of learners⟩
**Teaser.** NEXT TRACK · THE EDGE — a border you only see afterwards.

### Breath segment (no card)

Between Eris and the Heliopause, the telemetry line alone ticks: `TERMINATION SHOCK · 16 DEC 2004 · 94 AU · solar wind slowing…`, with the light-time counting up. No dialog, no new objects.

### 5.11 Track 11 ★ · Heliopause · AUG 2012

**Narration.** I left the Sun's bubble in August 2012. Nobody knew, not even me, until a solar storm made the plasma ring in 2013. Leadership works the same way: you see the crossing later, in the team.
**Track data.** Clear ownership · architecture before code · engineering as one system · Keynote "AI-Native Engineering", Ollyocon ⟨VERIFY year, audience⟩ · Impact ⟨VERIFY: e.g. teams or engineers led, a process change and its result⟩
**Full track.**

- _Challenge:_ ⟨owner: what wasn't working when you started⟩.
- _Action:_ the processes and culture you put in place.
- _Twist:_ ⟨owner⟩.
- _Proof:_ keynote slides or video ⟨VERIFY⟩.

**Teaser.** NEXT · LOOKING BACK.

### 5.12 Finale · Pale Blue Dot · 14 FEB 1990

- **Look-back caption** (kept): "Every line of code I've shipped was written on that dot."
- **Fact line** (fixed): `Earth from 6 billion km from the Sun · Voyager 1 · 14 Feb 1990`. Reword so "from" isn't repeated ⟨copy pass⟩.
- **Voyager's last line:** "That's the record. Eleven tracks, nine years. Whoever finds it, send a signal back."
- **Record sleeve:** one row with the 11 track titles, each clickable to jump back to it.
- **Live light-time:** computed, never hard-coded: "A signal to me now takes ⟨computed⟩. Yours reaches Sajeeb at once."
- **Contact card:** Email · GitHub · LinkedIn · Back to Earth (unchanged).

## 6. Reading mechanics

- **Hold until the visitor moves on.** In scroll mode, after the capture lap Voyager parks in a slow, calm orbit. The card stays open until the visitor scrolls forward and **never closes on a timer**. Flybys never stop Voyager.
- **Autoplay waits for the reader.** It holds each chapter for the slow-reader time (words ÷ 175 wpm, at least 8 s) and shows a countdown ring. Pause stays available, which WCAG 2.2.2 requires.
- **A fast reveal.** Only the header line types. The narration and track data appear within 600 ms. Any input completes the reveal at once. Screen readers get the full text immediately. Reduced motion shows static text.
- **Split frame (≥768 px).** At a chapter, the camera frames the body in the right third. The card takes a larger left column of about 40% with a backdrop blur, and the rest of the scene dims by about 20%. While a card is open nothing new appears: no comets, no particle bursts, no parallax spikes.
- **Phones.** The body sits in the upper half and the card is a bottom sheet, as today, with an explicit "Next track" tap.
- **The next body is visible.** The next chapter body grows on the horizon, backed by the teaser line.

## 7. Fast path and discovery

- **ID strip.** Always on screen: `Sajeeb Ahamed · VP Engineering · 9 yrs` · [≡ Tracks n/11] · [Text mode] · [Contact].
- **Track list (the record sleeve).** It grows out of the existing progress map rather than sitting beside it. It lists the 11 tracks, ticks them off as they are passed, jumps to any track, and shows the flyby projects under their chapter.
- **Text mode.** Generated from the same `journey.ts`: every chapter (narration, track data, full track) and every flyby, as semantic HTML.
- **Hidden signals** (later milestone, 2–3 of them):
  - the Golden Record on Voyager's hull opens liner notes on why this site exists;
  - a faint plume on Io's limb opens a debugging anecdote ⟨owner⟩;
  - a bonus track after the contact card.

  The track list shows "+n hidden signals". No fact may live only in a signal.

## 8. Numbers and facts wanted from the owner

Copy ships only after these are filled in or the slot is removed.

| Hero / item          | Suggested number                                                      | Where to find it                                  |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| Helix v2 / SPPB v5   | Active sites, downloads, or versions shipped while led                | JED listing, JoomShaper stats, internal analytics |
| Growfund / Kirki     | Active installs, campaigns or stores, or release scope                | wp.org stats, internal analytics                  |
| Druti                | Words or keys mapped, accuracy, platforms, users                      | Repo, App Store / TestFlight                      |
| Open source          | Total GitHub stars, Packagist / npm / Marketplace installs            | GitHub, Packagist, VS Code Marketplace            |
| AI agents            | Share of test questions answered correctly, or applications scored    | Your eval runs                                    |
| Leadership / keynote | Teams or engineers led, keynote year and audience, one process result | Ollyo records                                     |

Other owner checks:

- Corner Case dates; Ollyo start year; "led" wording for Helix v2 and SPPB v5.
- Your role on Kirki, Tutor LMS, Omnis, Talos and EasyStore.
- Whether the recruiter agent was built; whether the Druti playground is public; whether this site's repo is public.
- Number of teaching learners.
- Pronoun preference (§2).
- One real debugging story (Io signal).

## 9. Mission facts and sources

| Fact                                                                                                                                                                                                                                                                  | Source                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch 5 Sep 1977, 16 days after Voyager 2; reached Jupiter four months earlier; the cancelled Grand Tour cut down to Jupiter/Saturn; belt crossing 10 Dec 1977 – 8 Sep 1978; first single-frame Earth+Moon photo two weeks out (exact date ⟨VERIFY⟩); gravity assist | [NASA, 45 years ago](https://www.nasa.gov/technology/45-years-ago-voyager-1-begins-its-epic-journey-to-the-outer-planets-and-beyond/)                                                                                                   |
| Jupiter closest approach 5 Mar 1979, ~280,000 km (cloud tops)                                                                                                                                                                                                         | [NASA Science, Voyager 1](https://science.nasa.gov/mission/voyager/voyager-1/)                                                                                                                                                          |
| Io plume found by navigation engineer Linda Morabito in an image taken for navigation; cite "March 1979", not a day                                                                                                                                                   | [Drew Ex Machina](https://drewexmachina.com/2021/03/08/first-pictures-voyager-1-images-ios-volcanic-plumes-march-8-1979), [Guinness](https://www.guinnessworldrecords.com/world-records/first-discovery-of-extraterrestrial-volcanism)  |
| Ganymede is the largest moon in the solar system, bigger than Mercury                                                                                                                                                                                                 | ⟨VERIFY: add the NASA Ganymede page before publishing⟩                                                                                                                                                                                  |
| Saturn 12 Nov 1980; thousands of ringlets; 3 new moons; the Titan flyby ruled out any further planets                                                                                                                                                                 | [NASA, 40 years ago](https://www.nasa.gov/history/40-years-ago-voyager-1-explores-saturn/)                                                                                                                                              |
| FDS failure from 14 Nov 2023; ~3% memory corrupted; patch split up; 24 billion km, 22.5 h one way; data back Apr 2024                                                                                                                                                 | [JPL](https://www.jpl.nasa.gov/news/nasas-voyager-1-resumes-sending-engineering-updates-to-earth/), [NASA blog](https://science.nasa.gov/blogs/voyager/2024/04/04/engineers-pinpoint-cause-of-voyager-1-issue-are-working-on-solution/) |
| Golden Record: 115 images, 90 min of music, greetings in 55 languages, playing instructions in physics                                                                                                                                                                | [NASA Golden Record](https://science.nasa.gov/mission/voyager/golden-record-contents/), [NASA FAQ](https://science.nasa.gov/mission/voyager/frequently-asked-questions/)                                                                |
| Termination shock 16 Dec 2004, ~94 AU                                                                                                                                                                                                                                 | [NASA Science, Voyager 1](https://science.nasa.gov/mission/voyager/voyager-1/)                                                                                                                                                          |
| Heliopause 25 Aug 2012, confirmed after the 2013 solar storm made the plasma oscillate                                                                                                                                                                                | [JPL](https://www.jpl.nasa.gov/news/nasa-spacecraft-embarks-on-historic-journey-into-interstellar-space/)                                                                                                                               |
| Pale Blue Dot 14 Feb 1990, ~6 billion km from the Sun; cameras then powered off                                                                                                                                                                                       | [NASA Pale Blue Dot](https://science.nasa.gov/mission/voyager/voyager-1s-pale-blue-dot/)                                                                                                                                                |
| One light-day from Earth on 18 Nov 2026, so **compute it live, never hard-code it**                                                                                                                                                                                   | [NASA Science, Voyager 1](https://science.nasa.gov/mission/voyager/voyager-1/)                                                                                                                                                          |

Avoid unsourced comparisons (for example "less memory than a key fob") and hard-coded instrument counts, because NASA's own pages disagree.

## 10. Milestones

Each milestone is one OpenSpec change, built test-first, and ships value on its own.

- **M11 Story content.**
  - _Schema:_ split stops into `chapter` (narration, track data rows, teaser, optional full track, hero flag, act) and `flyby` (one line, optional link). Add a validation rule that a hero must have an Impact row.
  - _Content:_ rewrite `journey.ts` from §5 with ⟨VERIFY⟩ slots.
  - _Text mode:_ render chapters, full tracks and flybys.
  - _Interim:_ flybys show as labels; chapters keep today's dialog.
  - _Specs touched:_ journey-content, text-mode, stop-dialog.
- **M12 Reading mechanics.**
  - _Behaviour:_ hold until the visitor moves on; autoplay dwell with a countdown ring; fast reveal (header-only typing; typewriter-sound ticks only on the header); split frame with scene dim and calm; next-body preview and teaser; breath segment.
  - _Specs touched:_ orbit-capture, autoplay, stop-dialog, typewriter-sound, journey-navigation.
- **M13 Depth and fast path.**
  - _Behaviour:_ "▶ Play full track" expand that holds the voyage; ID strip; the track list (record sleeve) evolved from the progress map with jump and ticks.
  - _Specs touched:_ hud, stop-dialog.
- **M14 Finale.**
  - _Behaviour:_ Voyager's closing line, the record-sleeve summary, the live light-time line, the fact-line fix.
  - _Specs touched:_ finale.
- **M15 Hidden signals.**
  - _Behaviour:_ 2–3 discoverable signals and the "+n hidden signals" count in the track list.

**Before M11 starts:** the owner reviews §5 and fills in what they can from §8. Unfilled slots stay ⟨VERIFY⟩ and are listed in `plan.md`.

## 11. How we will know it works

- **Main measure:** visitors reach the contact card or text mode, and remember 2–3 facts.
- **Light, privacy-friendly instrumentation (optional):** time spent per chapter, rate of full-track expands, text-mode opens, contact reach.
- **Pruning rule:** if a chapter's expand or dwell numbers stay low, merge it into a flyby.
