import assert from "node:assert/strict";
import {
  buildWeeklyScorecard,
  formatSavedTime,
  getLocalWeekId,
  getNextMilestoneSeconds,
  updateWeeklyTimeSavedState,
} from "../src/helpers/weeklyScorecard.ts";

const sunday = new Date(2026, 4, 24, 12);
const monday = new Date(2026, 4, 25, 12);

assert.equal(getLocalWeekId(sunday), "2026-05-18");
assert.equal(getLocalWeekId(monday), "2026-05-25");

let state = updateWeeklyTimeSavedState(undefined, 5 * 60, monday);
state = updateWeeklyTimeSavedState(state, 12 * 60, new Date(2026, 4, 26, 12));
state = updateWeeklyTimeSavedState(state, 7 * 60, new Date(2026, 4, 27, 12));

let scorecard = buildWeeklyScorecard(state, 62 * 60, 15 * 60, monday);
assert.equal(scorecard.weeklyTotalSeconds, 24 * 60);
assert.equal(scorecard.bestDayIndex, 1);
assert.equal(scorecard.bestDaySeconds, 12 * 60);
assert.equal(scorecard.nextMilestoneSeconds, 2 * 60 * 60);
assert.equal(scorecard.newlyReachedMilestoneSeconds, 60 * 60);

scorecard = buildWeeklyScorecard(state, 62 * 60, 60 * 60, monday);
assert.equal(scorecard.newlyReachedMilestoneSeconds, undefined);

scorecard = buildWeeklyScorecard(state, 62 * 60, 60 * 60, new Date(2026, 5, 1, 12));
assert.equal(scorecard.weeklyTotalSeconds, 0);
assert.equal(scorecard.bestDayIndex, undefined);

assert.equal(getNextMilestoneSeconds(14 * 60), 15 * 60);
assert.equal(getNextMilestoneSeconds(24 * 60 * 60), 48 * 60 * 60);
assert.equal(formatSavedTime(42), "1 min");
assert.equal(formatSavedTime(12 * 60), "12 min");
assert.equal(formatSavedTime(72 * 60), "1h 12m");

console.log("Weekly scorecard verification passed");
