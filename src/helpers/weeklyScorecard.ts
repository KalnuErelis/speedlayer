export interface WeeklyTimeSavedState {
  weekId: string;
  dayTotals: [number, number, number, number, number, number, number];
}

export interface WeeklyScorecard {
  weeklyTotalSeconds: number;
  bestDayIndex: number | undefined;
  bestDaySeconds: number;
  lifetimeSeconds: number;
  nextMilestoneSeconds: number;
  newlyReachedMilestoneSeconds: number | undefined;
}

export const emptyWeeklyTimeSavedState: WeeklyTimeSavedState = {
  weekId: "",
  dayTotals: [0, 0, 0, 0, 0, 0, 0],
};

const milestoneSeconds = [
  15 * 60,
  60 * 60,
  2 * 60 * 60,
  5 * 60 * 60,
  10 * 60 * 60,
  24 * 60 * 60,
] as const;

export function getLocalWeekId(date = new Date()): string {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, "0");
  const day = String(weekStart.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalWeekdayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export function updateWeeklyTimeSavedState(
  previousState: WeeklyTimeSavedState | undefined,
  savedSecondsDelta: number,
  date = new Date()
): WeeklyTimeSavedState {
  const weekId = getLocalWeekId(date);
  const dayIndex = getLocalWeekdayIndex(date);
  const dayTotals =
    previousState?.weekId === weekId
      ? [...previousState.dayTotals]
      : [...emptyWeeklyTimeSavedState.dayTotals];

  dayTotals[dayIndex] = Math.max(
    0,
    dayTotals[dayIndex] + Math.max(0, savedSecondsDelta)
  );

  return {
    weekId,
    dayTotals: dayTotals as WeeklyTimeSavedState["dayTotals"],
  };
}

export function getNextMilestoneSeconds(lifetimeSeconds: number): number {
  const normalizedLifetime = Math.max(0, lifetimeSeconds);
  const fixedMilestone = milestoneSeconds.find(
    (threshold) => threshold > normalizedLifetime
  );

  if (fixedMilestone != undefined) {
    return fixedMilestone;
  }

  return (
    Math.floor(normalizedLifetime / (24 * 60 * 60) + 1) *
    24 *
    60 *
    60
  );
}

export function getReachedMilestoneSeconds(
  lifetimeSeconds: number
): number | undefined {
  const normalizedLifetime = Math.max(0, lifetimeSeconds);

  if (normalizedLifetime < milestoneSeconds[0]) {
    return undefined;
  }

  if (normalizedLifetime >= milestoneSeconds[milestoneSeconds.length - 1]) {
    return Math.floor(normalizedLifetime / (24 * 60 * 60)) * 24 * 60 * 60;
  }

  const reachedFixedMilestones = milestoneSeconds.filter(
    (threshold) => threshold <= normalizedLifetime
  );
  return reachedFixedMilestones[reachedFixedMilestones.length - 1];
}

export function buildWeeklyScorecard(
  weeklyState: WeeklyTimeSavedState | undefined,
  lifetimeSeconds: number,
  lastSeenLifetimeMilestoneSeconds: number,
  date = new Date()
): WeeklyScorecard {
  const currentWeek =
    weeklyState?.weekId === getLocalWeekId(date)
      ? weeklyState
      : emptyWeeklyTimeSavedState;
  const weeklyTotalSeconds = currentWeek.dayTotals.reduce(
    (sum, value) => sum + value,
    0
  );
  const bestDaySeconds = Math.max(...currentWeek.dayTotals);
  const bestDayIndex =
    bestDaySeconds > 0
      ? currentWeek.dayTotals.indexOf(bestDaySeconds)
      : undefined;
  const reachedMilestoneSeconds = getReachedMilestoneSeconds(lifetimeSeconds);

  return {
    weeklyTotalSeconds,
    bestDayIndex,
    bestDaySeconds,
    lifetimeSeconds: Math.max(0, lifetimeSeconds),
    nextMilestoneSeconds: getNextMilestoneSeconds(lifetimeSeconds),
    newlyReachedMilestoneSeconds:
      reachedMilestoneSeconds != undefined &&
      reachedMilestoneSeconds > lastSeenLifetimeMilestoneSeconds
        ? reachedMilestoneSeconds
        : undefined,
  };
}

export function formatSavedTime(seconds: number): string {
  const roundedSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.round(roundedSeconds / 60);

  if (minutes < 1) {
    return `${roundedSeconds}s`;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
