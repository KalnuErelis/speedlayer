import { bench, describe } from "vitest";
import { clamp } from "@/helpers/clamp";
import { cloneDeepJson } from "@/helpers/cloneDeepJson";

describe("clamp", () => {
  bench("clamp value within range", () => {
    clamp(5, 0, 10);
  });

  bench("clamp value below minimum", () => {
    clamp(-5, 0, 10);
  });

  bench("clamp value above maximum", () => {
    clamp(15, 0, 10);
  });
});

describe("cloneDeepJson", () => {
  const smallObject = { a: 1, b: "hello", c: true };

  const mediumObject = {
    settings: {
      soundedSpeed: 1.5,
      silenceSpeedRaw: 4,
      volumeThreshold: 0.005,
      enabled: true,
      marginBefore: 0.1,
      marginAfter: 0.1,
    },
    metadata: {
      version: "1.0.0",
      lastUpdated: "2024-01-01",
      tags: ["performance", "audio", "extension"],
    },
  };

  const largeObject = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => [
      `key${i}`,
      {
        value: i,
        nested: { deep: { data: `value-${i}` } },
        list: Array.from({ length: 10 }, (_, j) => j * i),
      },
    ])
  );

  bench("clone small object", () => {
    cloneDeepJson(smallObject);
  });

  bench("clone medium object", () => {
    cloneDeepJson(mediumObject);
  });

  bench("clone large object", () => {
    cloneDeepJson(largeObject);
  });
});

describe("filterOutUnchangedValues", () => {
  // Re-implement the core filtering logic here to benchmark it without
  // browser extension API dependencies (the original uses `browser.storage`
  // types and build-time defines).
  function filterOutUnchangedEntries(
    changes: Record<string, { oldValue?: unknown; newValue?: unknown }>
  ): Record<string, { oldValue?: unknown; newValue?: unknown }> {
    const clone: typeof changes = {};
    for (const [k, v] of Object.entries(changes)) {
      if (JSON.stringify(v.newValue) !== JSON.stringify(v.oldValue)) {
        clone[k] = v;
      }
    }
    return clone;
  }

  const mixedChanges: Record<
    string,
    { oldValue?: unknown; newValue?: unknown }
  > = {
    soundedSpeed: { oldValue: 1.0, newValue: 1.5 },
    silenceSpeed: { oldValue: 4, newValue: 4 },
    volumeThreshold: { oldValue: 0.005, newValue: 0.01 },
    enabled: { oldValue: true, newValue: true },
    marginBefore: { oldValue: 0.1, newValue: 0.2 },
  };

  const allChanged: Record<
    string,
    { oldValue?: unknown; newValue?: unknown }
  > = Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `setting${i}`,
      { oldValue: i, newValue: i + 1 },
    ])
  );

  const noneChanged: Record<
    string,
    { oldValue?: unknown; newValue?: unknown }
  > = Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `setting${i}`,
      { oldValue: i, newValue: i },
    ])
  );

  bench("filter mixed changes (some unchanged)", () => {
    filterOutUnchangedEntries(mixedChanges);
  });

  bench("filter all changed entries", () => {
    filterOutUnchangedEntries(allChanged);
  });

  bench("filter no changed entries", () => {
    filterOutUnchangedEntries(noneChanged);
  });
});
