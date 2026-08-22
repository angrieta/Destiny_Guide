# PlayPSO forum data inventory

A survey of what the official forum holds that the guide does not yet use.
Read on 2026-08-22 while logged in. Nothing here is scraped automatically; the
forum sits behind the same Cloudflare challenge as the rest of playpso.net, so
anything we want has to be copied by hand into `data/`.

Forum sections and their size at the time of reading:

| Section | Topics | What it holds |
| --- | --- | --- |
| News & Announcements (`forum/1`) | 132 | Patch notes, 0.5 through 0.944 |
| Events (`forum/3`) | 94 | Every seasonal event since 2019 |
| How to play (`forum/2`) | 5 | Tekking, the (outdated) custom gear list |
| Help & Support (`forum/7`) | 158 | The reference threads, plus tech support |
| Development (`forum/12`) | 10 | Quest author notes, tools |
| Quests (`forum/15`) | 7 | Per-quest monster counts and rewards |
| Skins (`forum/16`) | 19 | Client mods |
| Bugtracker (`forum/13`) | 118 | Mostly individual tickets |
| Community events (`forum/28`) | 12 | Time attack records, raffles |
| Market (`forum/9`) | 426 | Unstructured buy/sell posts |

The four pinned announcements are stubs apart from `announcement/102`, which
lists the endgame and raid quests with their star ratings.

## Datasets worth taking

### Item combinations — `topic/804`

Around 120 recipes covering weapons, armour, shields, cosmetics and mags, each
with its level requirement and, where it applies, a class or sex restriction.
Written as `result = ingredient + ingredient`. Includes the whole technique
merge family and the Orb of Illusions cosmetic line. Every item must be at max
grind to combine.

Nothing on the site currently explains where a combined item comes from, and the
database lists results without their ingredients.

### Combo bonus and buffed gear — `topic/1873`

The server's signature mechanic, and absent from the database entirely. Roughly
seventy entries, split into vanilla and Destiny items across melee, ranged and
technique, plus a list of items buffed unconditionally. A typical entry names the
item it depends on and what changes:

    Guld Milla (Required: Jointparts, ATP+400, Buffed Range,
                Auto-Aim special with 5-5-5 Hits)

Hit counts are written `N-H-S`, so `5-5-5` means five hits on each of the three
attacks. Other fields that appear: target count, range and angle, attack speed
percentage, ATP/ATA/MST bonuses, replaced animations, and conditions such as low
HP or a specific class.

### Quest difficulty tiers — `topic/1326`

VEL rates about ninety quests from 1 to 10 against a published rubric, tagged by
episode and by event. Level 10 is three quests; level 1 is the easiest SEGA
content. The same topic carries the difficulty definitions, which are worth
quoting rather than paraphrasing.

### Custom enemies and bosses — `topic/1326`

Full stat lines (HP, ATP, DFP, EVP, ESP) for about a dozen custom enemies, HP
for a dozen bosses, and immunity notes. Raid bosses run far past the normal
32767 ceiling — Manipulator III is 2,180,000, or 3,270,000 in its harder
version. A long list of enemies carry Demons immunity, which matters for
weapon choice and is documented nowhere else.

### Per-quest monster counts — `topic/1472`, `topic/146`, Orgodemirk's topic

Exact counts, floor by floor, for the quests their authors have written up.
`topic/1472` is VEL's and covers the custom quests; Orgodemirk's covers his own
and adds meseta rewards per difficulty and notes on secret areas. `topic/146` is
organised the other way round — enemy first, then the best quest and route to
farm it, with a count.

Counts plus the drop rates below give expected drops per run, which is the
calculation players actually want.

### Patch notes — `forum/1`

267k characters spanning the server's whole history. 447 lines carry a drop
rate. Item stat blocks appear in full when an item is introduced, which makes
this the only record of what an item looked like before a rebalance. Partly in
Japanese.

Two mechanics only documented here: drop rates are divided by the number of
players in the room, so event crates read

    Ultimate  1p: 1/500   2p: 1/350   3p: 1/250   4p: 1/200

and rare rates in Ultimate are doubled server-wide.

### Event archive — `forum/3`

Six recurring events a year, back to 2019, each with its exclusive items, crate
rates, and the quest built for it. Anniversary items are deliberately never
brought back (`topic` on anniversary policy), so this doubles as the record of
what is no longer obtainable.

### Crate contents

Phantasmal (`topic/606`), Legendary (`topic/1487`), Valentine (`topic/703` and
`topic/1801`), Anniversary and Daily. Community-compiled and hedged as such.
Legendary crates cost one photon token, five per clear of VR Underground.

### Commands — `topic/53`

About twenty-five commands documented properly: `/sectionid` with the ID
numbering, `/npc` with all twelve costumes, `/matreset` with the stat numbering,
`/dropstyle`, `/bank`, `/magtimer`, `/roominfo`, `/hh`, `/killcount`,
`/controller`. Several are Destiny-only.

### Tekking — `topic/576`

Two rules worth their own page. Attribute percentages move by at most 10 either
way from the untekked value, so the outcome space for a given weapon is five
fixed possibilities. And non-rare specials move one step within their family;
the nine families and their four tiers are listed in full.

### Server features versus vanilla — `topic/1310`

The answer to "what makes this server different", written twice — once by a
player in practical terms (you never get knocked down, swords are not the melee
meta, FOnewm may be the best solo character) and once as the official feature
list (x5/x10 EXP, infinite mag feed, 150k starting meseta, happy hour every 15.5
hours, free section ID during events, stacks to 250).

### Max stat and material plans — `topic/44`

Mag plan and material plan for all twelve classes, given three times each for
the three common unit setups (4-OPEN, ADEPT, Imm/Abi), all assuming Red Ring.
Manual work and disclaimed as possibly wrong, but it is the only such table.
Feeds directly into the calculator as presets.

FOmar 4-OPEN, for comparison against `data/class-stats.json`:
`5/122/73/0` mag, 95 power, 58 defense, 7 mind, 55 evade, 35 luck.

### Section ID hunt guide — `topic/103`

Best item per ID per quest for the standard farming quests. Complements the
drop tables we already sync, which are per difficulty and ID but say nothing
about which quest to run.

### Black Paper's Dangerous Deal — `topic/410`

Reward pools for Deal 1 and 2, per difficulty, split by the Rappy, Zu and
Dorphon routes.

### Mag feeding — `topic/552`, `topic/328`

`topic/552` is a step-by-step for raising a zero-DEF mag, including which
section ID and class to feed under at each stage. `topic/328` establishes that
PSO-World's feeding tables are wrong for Destiny and that corrected ones exist,
but the tables themselves are attachments rather than text.

### Donation token prices — `topic/36`

Official token cost for every purchasable item and service. The only fixed
price reference on a server whose economy is otherwise player-to-player.

### Time attack records — `forum/28`

A speedrun leaderboard kept as a forum post, split by episode, quest, player
count and whether photon blast was pre-built. Top five per category.

### Troubleshooting

Spread across Help & Support and the bugtracker: Steam Deck, Linux under Wine,
controller mapping, crash on alt-tab, running without UAC prompts, borderless
window, the unsigned-executable antivirus false positive.

## What was checked and is not worth taking

- `topic/190` "All Custom Gear stats + pics" is marked outdated and points at
  playpso.net/database, which the guide already mirrors.
- `topic/45` "All Class Stats" is a link to the Google Sheet already mined into
  `data/class-stats.json`. Its author notes the stats "will be easier to view
  somewhere on the site" in future — that page still does not exist anywhere.
- `topic/141` "Server Q&A" is 2017 policy, not mechanics.
- The Market section is 426 threads of buy/sell posts with no consistent format.
- The bugtracker is mostly individual tickets; only the recurring technical
  failures generalise.
