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
