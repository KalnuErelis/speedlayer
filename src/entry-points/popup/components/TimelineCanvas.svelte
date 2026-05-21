<!--
Copyright (C) 2026  SpeedLayer contributors

This file is part of Jump Cutter Browser Extension.

Jump Cutter Browser Extension is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Jump Cutter Browser Extension is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Jump Cutter Browser Extension.  If not, see <https://www.gnu.org/licenses/>.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { SpeedName_SILENCE, SpeedName_SOUNDED } from '@/helpers';
  import type { Settings } from '@/settings';
  import type { TelemetryMessage } from '@/entry-points/content/AllMediaElementsController';
  import {
    getTimelineMaxVolume,
    getTimelineStrokeY,
    getTimelineValueY,
  } from '../state/timelineChartMath';

  type TimelineSample = {
    timelineMs: number;
    volume: number;
    speedName: TelemetryMessage['lastActualPlaybackRateChange']['name'];
    outputDelaySeconds: number;
  };

  export let latestTelemetryRecord: TelemetryMessage | undefined;
  export let volumeThreshold: number;
  export let widthPx: number;
  export let heightPx: number;
  export let lengthSeconds: number;
  export let timeProgressionSpeed: Settings['popupChartSpeed'];
  export let soundedSpeed: number;
  export let onClick: () => void;

  let canvasEl: HTMLCanvasElement | undefined;
  let samples: TimelineSample[] = [];
  let lastSampleKey: string | undefined;
  let animationFrameId: number | undefined;

  $: visibleDurationMs = Math.max(
    1000,
    lengthSeconds * 1000 * (timeProgressionSpeed === 'soundedSpeedTime' ? soundedSpeed : 1),
  );
  $: latestSample = latestTelemetryRecord ? toTimelineSample(latestTelemetryRecord) : undefined;
  $: ingestSample(latestSample);
  $: drawSoon();

  function toTimelineSample(record: TelemetryMessage): TimelineSample {
    const timelineMs = timeProgressionSpeed === 'realTime'
      ? record.unixTime * 1000
      : record.intrinsicTime * 1000;

    return {
      timelineMs,
      volume: Math.max(0, record.inputVolume ?? 0),
      speedName: record.lastActualPlaybackRateChange.name,
      outputDelaySeconds: Math.max(0, record.totalOutputDelay ?? 0),
    };
  }

  function ingestSample(sample: TimelineSample | undefined) {
    if (!sample) return;

    const sampleKey = `${sample.timelineMs}:${sample.volume}:${sample.speedName}`;
    if (sampleKey === lastSampleKey) return;
    lastSampleKey = sampleKey;

    const newestAllowedTime = sample.timelineMs + 5;
    if (timeProgressionSpeed !== 'realTime') {
      samples = samples.filter(existing => existing.timelineMs <= newestAllowedTime);
    }

    samples = [...samples, sample]
      .filter(existing => existing.timelineMs >= sample.timelineMs - visibleDurationMs * 1.5)
      .slice(-480);
  }

  function drawSoon() {
    if (animationFrameId !== undefined) return;
    animationFrameId = requestAnimationFrame(() => {
      animationFrameId = undefined;
      draw();
    });
  }

  function setupCanvas(ctx: CanvasRenderingContext2D) {
    const ratio = window.devicePixelRatio || 1;
    const canvas = ctx.canvas;
    const pixelWidth = Math.max(1, Math.round(widthPx * ratio));
    const pixelHeight = Math.max(1, Math.round(heightPx * ratio));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    canvas.style.width = `${widthPx}px`;
    canvas.style.height = `${heightPx}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    setupCanvas(ctx);
    ctx.clearRect(0, 0, widthPx, heightPx);
    drawBackground(ctx);

    const last = samples[samples.length - 1];
    if (!last) {
      drawEmptyState(ctx);
      return;
    }

    const startMs = last.timelineMs - visibleDurationMs;
    const chartSamples = samples.filter(sample => sample.timelineMs >= startMs);
    const maxVolume = getTimelineMaxVolume(volumeThreshold, chartSamples.map(sample => sample.volume));
    drawGrid(ctx);
    drawSpeedBands(ctx, chartSamples, startMs);
    drawVolume(ctx, chartSamples, startMs, maxVolume);
    drawThreshold(ctx, maxVolume);
    drawOutputMarker(ctx, last.outputDelaySeconds);
  }

  function drawBackground(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createLinearGradient(0, 0, 0, heightPx);
    gradient.addColorStop(0, '#111816');
    gradient.addColorStop(1, '#0b100e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, widthPx, heightPx);
  }

  function drawEmptyState(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#6d7873';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('Waiting for media', 10, Math.round(heightPx / 2) + 4);
  }

  function drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const x = Math.round(widthPx * i / 4) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
      ctx.stroke();
    }
  }

  function xForTime(timeMs: number, startMs: number) {
    return (timeMs - startMs) / visibleDurationMs * widthPx;
  }

  function drawSpeedBands(
    ctx: CanvasRenderingContext2D,
    chartSamples: TimelineSample[],
    startMs: number,
  ) {
    if (!chartSamples.length) return;

    for (let i = 0; i < chartSamples.length; i += 1) {
      const current = chartSamples[i];
      const next = chartSamples[i + 1];
      const x = Math.max(0, xForTime(current.timelineMs, startMs));
      const nextX = next ? xForTime(next.timelineMs, startMs) : widthPx;
      const width = Math.max(1, Math.min(widthPx, nextX) - x);

      if (current.speedName === SpeedName_SILENCE) {
        ctx.fillStyle = 'rgba(242, 96, 96, 0.18)';
      } else if (current.speedName === SpeedName_SOUNDED) {
        ctx.fillStyle = 'rgba(107, 214, 160, 0.18)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      }
      ctx.fillRect(x, 0, width, heightPx);
    }
  }

  function drawVolume(
    ctx: CanvasRenderingContext2D,
    chartSamples: TimelineSample[],
    startMs: number,
    maxVolume: number,
  ) {
    if (chartSamples.length < 2) return;

    ctx.beginPath();
    chartSamples.forEach((sample, index) => {
      const x = xForTime(sample.timelineMs, startMs);
      const y = getTimelineValueY({ value: sample.volume, maxVolume, heightPx });
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(widthPx, heightPx);
    ctx.lineTo(Math.max(0, xForTime(chartSamples[0].timelineMs, startMs)), heightPx);
    ctx.closePath();
    ctx.fillStyle = 'rgba(113, 162, 255, 0.42)';
    ctx.fill();

    ctx.beginPath();
    chartSamples.forEach((sample, index) => {
      const x = xForTime(sample.timelineMs, startMs);
      const y = getTimelineValueY({ value: sample.volume, maxVolume, heightPx });
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(188, 209, 255, 0.82)';
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }

  function drawThreshold(ctx: CanvasRenderingContext2D, maxVolume: number) {
    const thresholdY = getTimelineStrokeY({ value: volumeThreshold, maxVolume, heightPx });
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(widthPx, thresholdY);
    ctx.stroke();
  }

  function drawOutputMarker(ctx: CanvasRenderingContext2D, outputDelaySeconds: number) {
    const offset = outputDelaySeconds * 1000 / visibleDurationMs * widthPx;
    const x = Math.max(0.5, Math.min(widthPx - 0.5, widthPx - offset));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, heightPx);
    ctx.stroke();
  }

  onMount(() => {
    draw();
  });

  onDestroy(() => {
    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }
  });
</script>

<button
  type="button"
  class="sl-timeline-button"
  aria-label="Toggle playback"
  on:click={onClick}
>
  <canvas
    bind:this={canvasEl}
    class="sl-timeline"
    aria-hidden="true"
  ></canvas>
</button>
