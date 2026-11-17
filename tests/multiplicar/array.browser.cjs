const {chromium,devices}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 const page=await browser.newPage({...devices['iPad (gen 7)'],viewport:{width:810,height:1080},deviceScaleFactor:1});
 await page.addInitScript(()=>Math.random=()=>0);await page.clock.install();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_BASE_URL||'http://localhost:8765')+'/multiplicar/');
 await page.locator('[data-table="10"]').tap();await page.locator('[data-level=all]').tap();await page.locator('#focusGame').tap();await page.locator('[data-start]').tap();
 for(let row=2;row<=10;row++){
  const gate=page.getByRole('button',{name:new RegExp(`Carril .*: ${row*10}$`)});
  for(let n=0;n<80&&!await gate.isVisible();n++)await page.clock.runFor(100);
  assert(await gate.isVisible());await gate.tap();
  for(let n=0;n<80&&(await page.locator('.array-row').count())<row;n++)await page.clock.runFor(100);
  assert.equal(await page.locator('.array-row').count(),row);assert.equal(await page.locator('.array-cell').count(),10*row);
 }
 await page.locator('#runnerPause').tap();assert.equal(await page.locator('#cargoEquation').textContent(),'10 × 10 = 100');
 assert((await page.locator('#trailStreak').textContent()).includes('9 puertas seguidas'));
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [width,height] of [[810,1080],[390,844],[1080,810]]){
  await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const rows=page.locator('.array-row');const first=await rows.first().locator('.array-cell').first().boundingBox(),last=await rows.last().locator('.array-cell').first().boundingBox();
  assert(Math.abs(first.x-last.x)<1);assert(last.y>first.y);assert.equal(await rows.first().locator('.array-cell').count(),10);
  const track=await page.locator('.runner-stage').boundingBox(),controls=await page.locator('.runner-controls').boundingBox();
  assert(controls.y>=track.y+track.height);assert(controls.y<track.y+track.height+30,'controls stay under track');
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.new-row').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS array: 10×1 through 10×10, exact cells/rows, aligned columns, streak feedback, iPad/mobile layouts, controls under track and reduced motion.');
})().catch(e=>{console.error(e);process.exit(1)});
