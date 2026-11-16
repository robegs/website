# Multiplication game checks

Run the pure arithmetic and board-generation checks with Node 22 or later:

```sh
node tests/multiplicar/math.test.mjs
```

The checks cover every table and both levels, correct/unique answer choices,
sufficient unique products for 2×2 and 3×3 bingo, winning lines and repeated sums.

Browser validation performed for the initial release:

- Complete five-question garden and balloon rounds, including wrong answers and hints.
- Reveal and match every memory pair; switch games during a mismatch timeout.
- Complete beginner and explorer bingo boards.
- Unlock the first sticker, then reload and verify saved stars.
- Exercise all four games with iPad touch emulation (portrait and landscape),
  a 390px phone viewport and a 1440px desktop viewport.
- Check JavaScript errors, asset requests and horizontal page overflow.

The iPad checks use browser emulation; they are not physical-device Safari tests.

## Las islas de Lila

Serve the repository with `python3 -m http.server 8765`, then run the browser
check with Playwright and Chromium installed:

```sh
node tests/multiplicar/adventure.browser.cjs
```

Set `TEST_BASE_URL` for another server. The adventure check covers all nine
checkpoints and three rescues, visual grouped counting, incorrect answers and
help, character movement, rewards, reload/resume without duplicate stars, replay,
table and difficulty switching, audio, focus mode with Escape, switching to the
original games, blocked browser storage, and 390/810/1080/1440px layouts with
44px touch controls. The existing four games and arithmetic checks also passed.

Adventure progress is stored separately for each table and difficulty. No personal
data is collected. Sound is off initially, and reduced-motion preferences disable
the travel transitions. iPad validation uses Chromium touch emulation, not Safari
on a physical iPad.
