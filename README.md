# The House Always Wins

A rigged fact-check gameshow. Guess **Fact or Fiction** about the candidate,
spin the wheel — and lose your tax dollars anyway, because the game is rigged.
Every claim links to its source. Companion piece to the Educate Ohio site.

Static site: plain HTML, CSS, and vanilla JS. No framework. The only build step
is the **claim validator**.

## Structure

```
ohio-gameshow/
├─ index.html            # The game shell
├─ data/
│  └─ claims.json        # The claim bank — the site's content database
├─ assets/
│  ├─ css/style.css      # Studio/gameshow styling
│  └─ js/game.js         # Wheel, guess→spin, dynamic no-repeat deck, host banter, Web Audio SFX + synth music
├─ tools/
│  └─ validate.js        # Fails the build if any claim is malformed or uncited
├─ netlify.toml          # publish "." · build runs the validator
└─ package.json          # npm run validate · npm start
```

## How it plays

- Draws **6 non-repeating rounds** per game from the claim bank (tracked in `localStorage`).
- Player guesses Fact/Fiction, then spins. **Every wedge is a loss** — a fair spin still drains the pot into "the house."
- The reveal shows the verdict, whether the guess was right, and a **link to the source**.
- Grows more replayable the bigger the bank gets; when the bank is exhausted it reshuffles.

## Editing claims

Edit `data/claims.json`. Each entry:

```json
{
  "id": "kebab-case-unique",
  "category": "Schemes",
  "claim": "The statement the player judges.",
  "answer": "false",
  "verdict": "Fiction",
  "explanation": "Your fact-checked summary.",
  "sourceUrl": "https://…",
  "sourcePublisher": "Publisher / report",
  "status": "verified"
}
```

Rules the **validator enforces** (`npm run validate`):
- every required field present; `id` unique + kebab-case
- `answer` is `"true"` or `"false"`
- `verdict` matches: `true → "Fact"`, `false → "Fiction"`
- **`sourceUrl` is a real http(s) link** — no claim ships uncited
- `status:"draft"` (or a `DRAFT …` explanation) passes but is flagged; flip to `"verified"` when fact-checked

The validator runs on every Netlify deploy, so bad data can't reach production.

## Run locally

`index.html` fetches `data/claims.json`, so serve over HTTP:

```bash
npm start          # python3 -m http.server 8000
# or: npx serve .
```

Then open http://localhost:8000.

## Deploy — Netlify continuous deployment

1. Push to a Git repo.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
3. Build command `node tools/validate.js` · Publish directory `.` (set by `netlify.toml`).
4. Every push auto-deploys — and a bad claim fails the build instead of shipping.

## Notes / TODO

- Sample claims are **draft** placeholders drawn from fakevivek.com sources — replace with fact-checked copy and flip `status` to `verified`.
- Wheel amounts, starting pot ($12,000), rounds-per-game (6), and host banter live at the top of `assets/js/game.js`.
- Pre-rendered voice-over and a licensed music bed can replace the synth audio later (see project notes).
