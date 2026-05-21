import { bench, describe } from "vitest";
import {
  buildWeeklyScorecard,
  updateWeeklyTimeSavedState,
  type WeeklyTimeSavedState,
} from "../src/helpers/weeklyScorecard";

const monday = new Date(2026, 4, 25, 12);
const weekDates = Array.from(
  { length: 7 },
  (_, index) => new Date(2026, 4, 25 + index, 12)
);

function createWeekState(): WeeklyTimeSavedState {
  let state: WeeklyTimeSavedState | undefined;

  for (let round = 0; round < 25; round += 1) {
    for (let day = 0; day < weekDates.length; day += 1) {
      state = updateWeeklyTimeSavedState(
        state,
        (day + 1) * 7.5,
        weekDates[day]
      );
    }
  }

  if (state == undefined) {
    throw new Error("Expected benchmark fixture state");
  }

  return state;
}

describe("weekly scorecard", () => {
  bench("aggregate current week", () => {
    const state = createWeekState();

    buildWeeklyScorecard(state, 2 * 60 * 60, 60 * 60, monday);
  });

  bench("reset stale week", () => {
    const state = createWeekState();

    buildWeeklyScorecard(state, 2 * 60 * 60, 60 * 60, new Date(2026, 5, 1, 12));
  });
});
