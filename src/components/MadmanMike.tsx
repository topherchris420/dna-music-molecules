import { useEffect, useRef, useCallback, useState } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────
const WIDTH = 960;
const HEIGHT = 680;
const TARGET = 1_000_000_000;

// Colors
const BG = "#0c1014";
const METAL = "#afb6bc";
const COPPER = "#d2762d";
const QUARTZ = "#d2e8ff";
const GRANITE = "#525458";
const GLOW = "#00ffaa";
const GLOW_DIM = "#00825a";
const RED = "#ff3737";
const GOLD = "#ffd700";
const AMBER = "#ffa01e";
const PANEL_BG = "#161c24";
const PANEL_BD = "#3c4655";
const LCD_BG = "#0a1e12";
const LCD_FG = "#00ff8c";

const toRGB = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

// Click zones with labels for tooltips
const CLICK_ZONES: Record<string, { rect: [number, number, number, number]; label: string; hint: string }> = {
  spark: { rect: [155, 55, 300, 115], label: "⚡ SPARK GAP", hint: "+95M volts" },
  hammer: { rect: [288, 185, 108, 185], label: "🔨 HAMMER", hint: "+14M volts" },
  pos_plate: { rect: [505, 365, 82, 170], label: "+ PLATE", hint: "+9M volts" },
  neg_plate: { rect: [597, 365, 82, 170], label: "− PLATE", hint: "+9M volts" },
};

const TELE_ZONES: Record<string, [number, number, number, number]> = {
  activate: [580, 220, 340, 46],
  plasma: [580, 278, 340, 46],
  lightning: [580, 336, 340, 46],
  hafnium: [580, 394, 340, 46],
};

// ─── Sound ──────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playBeep(freq: number, durationMs: number, vol: number) {
  try {
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // silent fail
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

interface Arc {
  x1: number; y1: number; x2: number; y2: number; life: number; color: string;
}

interface VoicePopup {
  text: string; timer: number; color: string; size: "big" | "huge";
}

interface GameState {
  volts: number;
  hammerY: number;
  hammerDir: number;
  gamePhase: number; // 0=intro, 1=build, 2=panel, 3=UFO escape
  teleporting: boolean;
  teleTimer: number;
  teleSuccess: boolean;
  gameOver: boolean;
  combo: number;
  comboTimer: number;
  shakeFrames: number;
  shakeMag: number;
  tick: number;
  clickFlashes: Record<string, number>;
  particles: Particle[];
  arcs: Arc[];
  voice: VoicePopup;
  ufoX: number;
  ufoY: number;
  hoveredZone: string | null;
  introTimer: number;
  totalClicks: number;
  peakCombo: number;
  phaseJustChanged: boolean;
  phaseChangeTimer: number;
}

function createInitialState(): GameState {
  return {
    volts: 0, hammerY: 0, hammerDir: 1, gamePhase: 0,
    teleporting: false, teleTimer: 0, teleSuccess: false, gameOver: false,
    combo: 0, comboTimer: 0, shakeFrames: 0, shakeMag: 0, tick: 0,
    clickFlashes: {}, particles: [], arcs: [],
    voice: { text: "", timer: 0, color: GLOW, size: "big" },
    ufoX: WIDTH + 300, ufoY: 220,
    hoveredZone: null, introTimer: 180, totalClicks: 0, peakCombo: 0,
    phaseJustChanged: false, phaseChangeTimer: 0,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function randInt(a: number, b: number) { return Math.floor(rand(a, b + 1)); }
function pickColor(): string {
  return [GLOW, "#ffdc32", "#78d2ff", AMBER][randInt(0, 3)];
}

function createSparks(s: GameState, cx: number, cy: number, num: number, big = false) {
  for (let i = 0; i < num; i++) {
    s.particles.push({
      x: cx, y: cy, vx: rand(-3.5, 3.5), vy: rand(-5.5, 0.5),
      life: big ? randInt(50, 90) : randInt(30, 60),
      maxLife: big ? 90 : 60,
      color: pickColor(), size: big ? rand(3, 7) : rand(2, 5),
    });
  }
}

function triggerShake(s: GameState, mag: number, frames: number) {
  s.shakeFrames = Math.max(s.shakeFrames, frames);
  s.shakeMag = Math.max(s.shakeMag, mag);
}

function getShake(s: GameState): [number, number] {
  if (s.shakeFrames <= 0) return [0, 0];
  return [randInt(-s.shakeMag, s.shakeMag), randInt(-s.shakeMag / 2, s.shakeMag / 2)];
}

function formatVolts(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return Math.floor(v).toString();
}

// ─── Drawing helpers ────────────────────────────────────────────────────────
function glowText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  color: string, fontSize: number, pulse: boolean, tick: number
) {
  const t = tick * 0.06;
  const amp = pulse ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t)) : 1.0;
  const [r, g, b] = toRGB(color);
  const col = `rgb(${Math.floor(r * amp)},${Math.floor(g * amp)},${Math.floor(b * amp)})`;
  const dim = `rgb(${Math.floor(r * amp * 0.25)},${Math.floor(g * amp * 0.25)},${Math.floor(b * amp * 0.25)})`;

  ctx.font = `bold ${fontSize}px Consolas, monospace`;
  ctx.fillStyle = dim;
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) {
    ctx.fillText(text, x + dx, y + dy);
  }
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
}

function drawArc(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const segs = 10;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    ctx.lineTo(x1 + (x2 - x1) * t + randInt(-12, 12), y1 + (y2 - y1) * t + randInt(-12, 12));
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawCRT(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  for (let y = 0; y < HEIGHT; y += 3) {
    ctx.fillRect(0, y, WIDTH, 1);
  }
}

// ─── Draw hover highlight for clickable zones ──────────────────────────────
function drawZoneHighlight(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tick: number, ox: number, oy: number) {
  const pulse = 0.3 + 0.3 * Math.sin(tick * 0.1);
  ctx.strokeStyle = `rgba(0,255,170,${pulse.toFixed(2)})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x + ox, y + oy, w, h);
  ctx.setLineDash([]);
  // Subtle fill
  ctx.fillStyle = `rgba(0,255,170,${(pulse * 0.12).toFixed(3)})`;
  ctx.fillRect(x + ox, y + oy, w, h);
}

// ─── Draw tooltip ──────────────────────────────────────────────────────────
function drawTooltip(ctx: CanvasRenderingContext2D, text: string, hint: string, mx: number, my: number) {
  ctx.font = "bold 14px Consolas, monospace";
  const tw1 = ctx.measureText(text).width;
  ctx.font = "12px Consolas, monospace";
  const tw2 = ctx.measureText(hint).width;
  const tw = Math.max(tw1, tw2) + 20;
  const th = 44;
  let tx = mx + 14;
  let ty = my - th - 8;
  if (tx + tw > WIDTH) tx = mx - tw - 8;
  if (ty < 4) ty = my + 20;

  // Tooltip bg
  ctx.fillStyle = "rgba(12,16,20,0.92)";
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, 6);
  ctx.fill();
  ctx.strokeStyle = GLOW;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = GLOW;
  ctx.font = "bold 14px Consolas, monospace";
  ctx.fillText(text, tx + 10, ty + 18);
  ctx.fillStyle = AMBER;
  ctx.font = "12px Consolas, monospace";
  ctx.fillText(hint, tx + 10, ty + 36);
}

// ─── Intro overlay ─────────────────────────────────────────────────────────
function drawIntro(ctx: CanvasRenderingContext2D, timer: number, tick: number) {
  const progress = 1 - timer / 180;
  const alpha = timer > 30 ? 0.88 : (timer / 30) * 0.88;

  ctx.fillStyle = `rgba(8,12,16,${alpha.toFixed(2)})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (timer > 60) {
    const textAlpha = Math.min(1, (180 - timer) / 40);
    ctx.globalAlpha = textAlpha;
    glowText(ctx, "MADMAN MIKE'S", WIDTH / 2 - 180, HEIGHT / 2 - 80, GOLD, 42, true, tick);
    glowText(ctx, "FREE ENERGY TELEPORTER", WIDTH / 2 - 260, HEIGHT / 2 - 30, GLOW, 36, false, tick);

    if (timer < 140) {
      ctx.fillStyle = "#8a9a8a";
      ctx.font = "16px Consolas, monospace";
      const t1 = "Click the machine parts to build energy!";
      ctx.fillText(t1, WIDTH / 2 - ctx.measureText(t1).width / 2, HEIGHT / 2 + 40);
    }
    if (timer < 100) {
      ctx.fillStyle = AMBER;
      ctx.font = "14px Consolas, monospace";
      const t2 = "Build combos by clicking fast • Reach 1 BILLION volts to teleport";
      ctx.fillText(t2, WIDTH / 2 - ctx.measureText(t2).width / 2, HEIGHT / 2 + 70);
    }
    ctx.globalAlpha = 1;
  }

  // Progress bar at bottom
  ctx.fillStyle = "rgba(0,255,170,0.3)";
  ctx.fillRect(0, HEIGHT - 4, WIDTH * progress, 4);
}

// ─── Phase transition banner ────────────────────────────────────────────────
function drawPhaseTransition(ctx: CanvasRenderingContext2D, timer: number, tick: number) {
  if (timer <= 0) return;
  const alpha = Math.min(1, timer / 30) * 0.85;
  const y = HEIGHT / 2 - 30;

  ctx.fillStyle = `rgba(0,0,0,${(alpha * 0.6).toFixed(2)})`;
  ctx.fillRect(0, y - 20, WIDTH, 80);

  ctx.globalAlpha = alpha;
  glowText(ctx, "◈ TELEPORT PANEL UNLOCKED ◈", WIDTH / 2 - 260, y + 15, GLOW, 32, true, tick);
  ctx.fillStyle = `rgba(255,170,30,${alpha.toFixed(2)})`;
  ctx.font = "14px Consolas, monospace";
  const sub = "Use boost buttons to charge faster!";
  ctx.fillText(sub, WIDTH / 2 - ctx.measureText(sub).width / 2, y + 50);
  ctx.globalAlpha = 1;
}

// ─── Main drawing ───────────────────────────────────────────────────────────
function drawMachine(ctx: CanvasRenderingContext2D, s: GameState, ox: number, oy: number) {
  // Machine body
  ctx.fillStyle = "#1c2028";
  ctx.beginPath();
  ctx.roundRect(65 + ox, 60 + oy, 445, 490, 12);
  ctx.fill();
  ctx.strokeStyle = PANEL_BD;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Horseshoe magnet arc
  ctx.beginPath();
  ctx.arc(305 + ox, 143 + oy, 145, Math.PI * 0.12, Math.PI * 0.88, false);
  ctx.strokeStyle = METAL;
  ctx.lineWidth = 30;
  ctx.stroke();

  // N/S poles
  ctx.fillStyle = "#dc3c3c";
  ctx.beginPath(); ctx.arc(180 + ox, 80 + oy, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3c64dc";
  ctx.beginPath(); ctx.arc(432 + ox, 80 + oy, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "12px Consolas, monospace";
  ctx.fillText("N", 174 + ox, 85 + oy);
  ctx.fillText("S", 426 + ox, 85 + oy);

  // Coils
  for (const rx of [208, 400]) {
    for (let i = 0; i < 180; i += 10) {
      const shade = 140 + Math.floor(40 * Math.sin(i * 0.15 + s.tick * 0.08));
      ctx.fillStyle = `rgb(${shade},${shade + 5},${shade + 8})`;
      ctx.fillRect(rx + ox, 170 + i + oy, 24, 11);
    }
    ctx.strokeStyle = PANEL_BD;
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + ox, 170 + oy, 24, 180);
  }

  // Granite transducer
  ctx.fillStyle = GRANITE;
  ctx.fillRect(155 + ox, 358 + oy, 300, 70);
  ctx.fillStyle = "#c8cacd";
  ctx.font = "15px Consolas, monospace";
  ctx.fillText("GRANITE TRANSDUCER", 172 + ox, 400 + oy);

  // Hammer
  const hamHeadY = 232 + s.hammerY;
  ctx.fillStyle = "#785a3c";
  ctx.fillRect(330 + ox, 190 + s.hammerY + oy, 24, 100);
  ctx.fillStyle = "#3c4148";
  ctx.beginPath();
  ctx.roundRect(296 + ox, hamHeadY + oy, 92, 36, 4);
  ctx.fill();

  // Crystal blocks
  ctx.fillStyle = QUARTZ;
  ctx.fillRect(155 + ox, 438 + oy, 130, 60);
  ctx.fillStyle = GRANITE;
  ctx.fillRect(295 + ox, 438 + oy, 160, 60);

  // Plates
  for (const [px, label, hue] of [[508, "+", "#00ff50"], [600, "−", "#ff3c3c"]] as const) {
    const pulseW = 68 + Math.floor(4 * Math.sin(s.tick * 0.12));
    ctx.fillStyle = COPPER;
    ctx.fillRect(px + ox, 370 + oy, pulseW, 160);
    ctx.fillStyle = hue;
    ctx.font = "bold 36px Consolas, monospace";
    ctx.fillText(label, px + 24 + ox, 400 + oy);
  }

  // Flash effects
  const flashAreas: Record<string, [number, number, number, number]> = {
    spark: [155, 55, 300, 115], hammer: [288, 185, 108, 185],
    pos_plate: [505, 365, 82, 170], neg_plate: [597, 365, 82, 170],
  };
  for (const [key, [fx, fy, fw, fh]] of Object.entries(flashAreas)) {
    const f = s.clickFlashes[key] || 0;
    if (f > 0) {
      ctx.fillStyle = `rgba(255,255,200,${(f / 12) * 0.7})`;
      ctx.fillRect(fx + ox, fy + oy, fw, fh);
    }
  }

  // Hover highlights for clickable zones in phase 1
  if (s.gamePhase >= 1 && !s.gameOver) {
    for (const [key, zone] of Object.entries(CLICK_ZONES)) {
      const [zx, zy, zw, zh] = zone.rect;
      if (s.hoveredZone === key) {
        drawZoneHighlight(ctx, zx, zy, zw, zh, s.tick, ox, oy);
      } else if (s.gamePhase === 1 && s.tick < 300) {
        // Gentle pulsing border on all zones early on to guide players
        const earlyPulse = Math.max(0, 0.15 * (1 - s.tick / 300) * (0.5 + 0.5 * Math.sin(s.tick * 0.08 + Object.keys(CLICK_ZONES).indexOf(key))));
        if (earlyPulse > 0.01) {
          ctx.strokeStyle = `rgba(0,255,170,${earlyPulse.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.strokeRect(zx + ox, zy + oy, zw, zh);
          ctx.setLineDash([]);
        }
      }
    }
  }

  // Labels
  ctx.fillStyle = GOLD;
  ctx.font = "15px Consolas, monospace";
  ctx.fillText("HORSE SHOE MAGNET", 230 + ox, 52 + oy);
  ctx.fillStyle = AMBER;
  ctx.fillText("30,000 CYCLES/MIN", 218 + ox, 338 + oy);
  ctx.fillStyle = "#b4e684";
  ctx.fillText("FREE ENERGY OUTPUT", 80 + ox, 548 + oy);

  // Spark gap label
  const gc = `rgb(${80 + Math.floor(80 * Math.sin(s.tick * 0.2))},255,${160 + Math.floor(60 * Math.sin(s.tick * 0.15))})`;
  ctx.fillStyle = gc;
  ctx.fillText("► SPARK GAP — CLICK FOR SURGE ◄", 168 + ox, 162 + oy);
}

function drawTeleportPanel(ctx: CanvasRenderingContext2D, s: GameState, ox: number, oy: number) {
  // Panel bg
  ctx.fillStyle = PANEL_BG;
  ctx.beginPath();
  ctx.roundRect(560 + ox, 60 + oy, 375, 490, 10);
  ctx.fill();
  ctx.strokeStyle = PANEL_BD;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Title
  glowText(ctx, "◈ TELEPORT CTRL ◈", 585 + ox, 100 + oy, GLOW, 36, true, s.tick);

  // LCD date
  ctx.fillStyle = LCD_BG;
  ctx.beginPath();
  ctx.roundRect(580 + ox, 118 + oy, 340, 55, 4);
  ctx.fill();
  ctx.fillStyle = LCD_FG;
  ctx.font = "22px Consolas, monospace";
  ctx.fillText("02/23/1996  04:44:44", 595 + ox, 155 + oy);

  // Progress bar
  const pct = Math.min(1, s.volts / TARGET);
  ctx.fillStyle = "#191f1c";
  ctx.beginPath();
  ctx.roundRect(580 + ox, 182 + oy, 340, 18, 4);
  ctx.fill();
  if (pct > 0) {
    ctx.fillStyle = pct < 0.95 ? GLOW : RED;
    ctx.beginPath();
    ctx.roundRect(580 + ox, 182 + oy, Math.floor(340 * pct), 18, 4);
    ctx.fill();
  }
  // Percentage label on progress bar
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px Consolas, monospace";
  ctx.fillText(`${(pct * 100).toFixed(1)}%`, 740 + ox, 195 + oy);

  // Buttons
  const btns: [string, string, string][] = [
    ["ACTIVATE TELEPORT", GLOW, "activate"],
    ["PLASMA IGNITION", "#dcb4ff", "plasma"],
    ["LIGHTNING ROD", AMBER, "lightning"],
    ["HAFNIUM BOOST", "#b4ffdc", "hafnium"],
  ];
  for (let i = 0; i < btns.length; i++) {
    const [label, color, key] = btns[i];
    const by = 220 + i * 58;
    const flash = s.clickFlashes[`tele_${key}`] || 0;
    const isHovered = s.hoveredZone === `tele_${key}`;
    const [cr, cg, cb] = toRGB(color);
    let bcol: string;
    const isDisabled = key === "activate" && s.volts < TARGET * 0.95;
    if (flash > 0) {
      bcol = `rgb(${Math.min(255, cr + 80)},${Math.min(255, cg + 80)},${Math.min(255, cb + 80)})`;
    } else if (isDisabled) {
      bcol = "#283c32";
    } else if (isHovered) {
      bcol = `rgb(${Math.min(255, cr + 30)},${Math.min(255, cg + 30)},${Math.min(255, cb + 30)})`;
    } else {
      bcol = color;
    }
    ctx.fillStyle = bcol;
    ctx.beginPath();
    ctx.roundRect(580 + ox, by + oy, 340, 46, 6);
    ctx.fill();

    // Hover outline
    if (isHovered && !isDisabled) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = flash > 0 ? "#000" : BG;
    ctx.font = "bold 22px Consolas, monospace";
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, 580 + 170 - tw / 2 + ox, by + 30 + oy);

    // Disabled text
    if (isDisabled) {
      ctx.fillStyle = "#4a6050";
      ctx.font = "11px Consolas, monospace";
      ctx.fillText("NEED 95%+ CHARGE", 690 + ox, by + 42 + oy);
    }
  }

  // Coordinates
  ctx.fillStyle = "#121620";
  ctx.beginPath();
  ctx.roundRect(580 + ox, 455 + oy, 340, 70, 4);
  ctx.fill();
  ctx.fillStyle = LCD_FG;
  ctx.font = "22px Consolas, monospace";
  ctx.fillText("40.7128° N  74.0060° W", 595 + ox, 500 + oy);
}

function drawVoltmeter(ctx: CanvasRenderingContext2D, s: GameState, ox: number, oy: number) {
  ctx.fillStyle = LCD_BG;
  ctx.beginPath();
  ctx.roundRect(65 + ox, 568 + oy, 445, 95, 6);
  ctx.fill();

  ctx.fillStyle = GLOW_DIM;
  ctx.font = "12px Consolas, monospace";
  ctx.fillText("FREE ENERGY OUTPUT (VOLTS)", 80 + ox, 584 + oy);

  const pct = Math.min(1, s.volts / TARGET);
  const col = pct < 0.9 ? GLOW : pct < 1.0 ? AMBER : RED;
  const valStr = s.volts >= TARGET
    ? `CRITICAL  ${Math.floor(s.volts).toLocaleString()}`
    : Math.floor(s.volts).toLocaleString();
  glowText(ctx, valStr, 80 + ox, 638 + oy, col, 48, pct > 0.7, s.tick);

  if (s.combo > 1) {
    ctx.fillStyle = s.combo < 5 ? GOLD : RED;
    ctx.font = "22px Consolas, monospace";
    ctx.fillText(`×${s.combo} COMBO!`, 370 + ox, 618 + oy);
  }

  // Mini stats
  ctx.fillStyle = "#3c5050";
  ctx.font = "11px Consolas, monospace";
  ctx.fillText(`CLICKS: ${s.totalClicks}  │  PEAK COMBO: ×${s.peakCombo}  │  TARGET: ${formatVolts(TARGET)}`, 80 + ox, 656 + oy);
}

function drawUFO(ctx: CanvasRenderingContext2D, ux: number, uy: number, tick: number) {
  ctx.fillStyle = "#b4b4d2";
  ctx.beginPath();
  ctx.ellipse(ux, uy + 47, 110, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5a6478";
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = "#50d2ff";
  ctx.beginPath();
  ctx.ellipse(ux, uy - 3, 48, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.strokeStyle = METAL;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(ux, uy - 65);
  ctx.lineTo(ux, uy - 105);
  ctx.stroke();
  ctx.fillStyle = "#ffdc50";
  ctx.beginPath();
  ctx.arc(ux, uy - 110, 9, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const r = 125 + i * 12 + Math.floor(8 * Math.sin(tick * 0.3 + i));
    ctx.strokeStyle = `rgba(0,255,170,${(0.12 - i * 0.02).toFixed(2)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ux, uy + 35, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ─── Close button ───────────────────────────────────────────────────────────
function drawCloseButton(ctx: CanvasRenderingContext2D, hovered: boolean) {
  const x = WIDTH - 40;
  const y = 8;
  const size = 28;

  ctx.fillStyle = hovered ? "rgba(255,50,50,0.6)" : "rgba(60,70,85,0.6)";
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 6);
  ctx.fill();

  ctx.strokeStyle = hovered ? "#ff6666" : "#8a9aa0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 8);
  ctx.lineTo(x + size - 8, y + size - 8);
  ctx.moveTo(x + size - 8, y + 8);
  ctx.lineTo(x + 8, y + size - 8);
  ctx.stroke();
}

const CLOSE_BTN_RECT = [WIDTH - 40, 8, 28, 28] as const;

// ─── Component ──────────────────────────────────────────────────────────────
interface MadmanMikeProps {
  onClose: () => void;
}

export const MadmanMike = ({ onClose }: MadmanMikeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });
  const [, forceUpdate] = useState(0);

  const getCanvasCoords = useCallback((clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [(clientX - rect.left) * WIDTH / rect.width, (clientY - rect.top) * HEIGHT / rect.height];
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const [mx, my] = getCanvasCoords(e.clientX, e.clientY);
    mouseRef.current = { x: mx, y: my };
    const s = stateRef.current;
    s.hoveredZone = null;

    // Check close button
    if (mx >= CLOSE_BTN_RECT[0] && mx <= CLOSE_BTN_RECT[0] + CLOSE_BTN_RECT[2] &&
        my >= CLOSE_BTN_RECT[1] && my <= CLOSE_BTN_RECT[1] + CLOSE_BTN_RECT[3]) {
      s.hoveredZone = "close";
      return;
    }

    if (s.gameOver || s.gamePhase === 0) return;

    if (s.gamePhase === 1) {
      for (const [key, zone] of Object.entries(CLICK_ZONES)) {
        const [x, y, w, h] = zone.rect;
        if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
          s.hoveredZone = key;
          return;
        }
      }
    }
    if (s.gamePhase >= 2) {
      for (const [key, [x, y, w, h]] of Object.entries(TELE_ZONES)) {
        if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
          s.hoveredZone = `tele_${key}`;
          return;
        }
      }
      // Also check machine zones in phase 2
      for (const [key, zone] of Object.entries(CLICK_ZONES)) {
        const [x, y, w, h] = zone.rect;
        if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
          s.hoveredZone = key;
          return;
        }
      }
    }
  }, [getCanvasCoords]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const [mx, my] = getCanvasCoords(e.clientX, e.clientY);
    const s = stateRef.current;

    // Close button
    if (mx >= CLOSE_BTN_RECT[0] && mx <= CLOSE_BTN_RECT[0] + CLOSE_BTN_RECT[2] &&
        my >= CLOSE_BTN_RECT[1] && my <= CLOSE_BTN_RECT[1] + CLOSE_BTN_RECT[3]) {
      onClose();
      return;
    }

    // Skip intro on click
    if (s.gamePhase === 0) {
      s.introTimer = Math.min(s.introTimer, 30);
      return;
    }

    if (s.gameOver) return;

    if (s.gamePhase >= 1) {
      for (const [key, zone] of Object.entries(CLICK_ZONES)) {
        const [x, y, w, h] = zone.rect;
        if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
          s.comboTimer = 180;
          s.combo = Math.min(s.combo + 1, 10);
          s.totalClicks++;
          s.peakCombo = Math.max(s.peakCombo, s.combo);
          const mult = 1 + (s.combo - 1) * 0.4;
          if (key === "spark") {
            s.volts += 95_000_000 * mult;
            s.clickFlashes.spark = 12;
            createSparks(s, 220, 108, 30, true);
            triggerShake(s, 8, 10);
            for (let i = 0; i < 4; i++) {
              s.arcs.push({ x1: 180, y1: 90, x2: randInt(350, 430), y2: randInt(70, 130), life: 8, color: GLOW });
            }
            playBeep(1320, 55, 0.38);
          } else if (key === "hammer") {
            s.volts += 14_000_000 * mult;
            s.clickFlashes.hammer = 12;
            createSparks(s, 340, 270, 18);
            triggerShake(s, 12, 14);
            s.hammerY = -42;
            playBeep(165, 135, 0.48);
          } else {
            s.volts += 9_000_000 * mult;
            const px = key.includes("pos") ? 540 : 630;
            s.clickFlashes[key] = 12;
            createSparks(s, px, 450, 12);
            triggerShake(s, 4, 6);
            playBeep(920, 35, 0.28);
          }
          return;
        }
      }
    }

    if (s.gamePhase >= 2) {
      for (const [key, [x, y, w, h]] of Object.entries(TELE_ZONES)) {
        if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
          s.clickFlashes[`tele_${key}`] = 10;
          s.totalClicks++;
          if (key === "activate" && s.volts >= TARGET * 0.95) {
            s.teleporting = true;
            s.teleSuccess = Math.random() > 0.18;
            playBeep(280, 650, 0.45);
          } else if (key === "plasma") {
            s.volts += 28_000_000 * (1 + (s.combo - 1) * 0.3);
            createSparks(s, 720, 260, 35, true);
            triggerShake(s, 6, 8);
            s.comboTimer = 180;
            s.combo = Math.min(s.combo + 1, 10);
            s.peakCombo = Math.max(s.peakCombo, s.combo);
            playBeep(680, 180, 0.42);
          } else if (key === "lightning") {
            s.volts += 18_000_000 * (1 + (s.combo - 1) * 0.3);
            createSparks(s, 720, 260, 22);
            triggerShake(s, 5, 7);
            playBeep(420, 220, 0.35);
          } else if (key === "hafnium") {
            s.volts += 35_000_000 * (1 + (s.combo - 1) * 0.3);
            createSparks(s, 720, 260, 28, true);
            triggerShake(s, 7, 9);
            playBeep(1350, 90, 0.4);
          }
          return;
        }
      }
    }
  }, [getCanvasCoords, onClose]);

  // Touch support
  const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;
    const [mx, my] = getCanvasCoords(touch.clientX, touch.clientY);
    // Simulate click via synthetic mouse event logic
    handleClick({
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>);
  }, [getCanvasCoords, handleClick]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = stateRef.current;
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key.toLowerCase() === "r" && s.gameOver) {
      Object.assign(stateRef.current, createInitialState());
      forceUpdate((n) => n + 1);
    }
    // Skip intro with any key
    if (s.gamePhase === 0 && e.key !== "Escape") {
      s.introTimer = Math.min(s.introTimer, 30);
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      s.tick++;

      // Intro countdown
      if (s.gamePhase === 0) {
        s.introTimer--;
        if (s.introTimer <= 0) {
          s.gamePhase = 1;
        }
      }

      // Update hammer
      s.hammerY += s.hammerDir * 14 * (16 / 16);
      if (s.hammerY > 38) {
        s.hammerDir = -1;
        s.volts += 60_000;
        if (Math.random() < 0.35) createSparks(s, 340, 375, 8);
        triggerShake(s, 2, 3);
      } else if (s.hammerY < -26) {
        s.hammerDir = 1;
      }

      s.volts += 40_000 * (16 / 1000);

      // Combo decay
      if (s.comboTimer > 0) s.comboTimer--;
      else s.combo = Math.max(0, s.combo - 1);

      // Update particles
      s.particles = s.particles.filter((p) => p.life > 0);
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.vx *= 0.98;
        p.life--;
      }

      // Update arcs
      s.arcs = s.arcs.filter((a) => a.life > 0);
      for (const a of s.arcs) a.life--;

      // Spontaneous arcs
      if (s.volts > 200_000_000 && Math.random() < 0.08) {
        s.arcs.push({ x1: 208, y1: 170, x2: 208, y2: 350, life: 5, color: GLOW });
      }
      if (s.volts > 500_000_000 && Math.random() < 0.06) {
        s.arcs.push({ x1: 400, y1: 170, x2: 400, y2: 350, life: 5, color: "#64b4ff" });
      }

      // Phase transition
      if (s.volts > TARGET * 0.28 && s.gamePhase === 1) {
        s.gamePhase = 2;
        s.phaseJustChanged = true;
        s.phaseChangeTimer = 120;
        playBeep(600, 300, 0.3);
      }

      if (s.phaseChangeTimer > 0) s.phaseChangeTimer--;

      // Teleport
      if (s.teleporting) {
        s.volts += 55_000_000;
        s.teleTimer++;
        createSparks(s, WIDTH / 2, HEIGHT / 2, 6, true);
        if (s.teleTimer >= 120) {
          s.gameOver = true;
          if (s.teleSuccess) {
            s.gamePhase = 3;
            s.voice = { text: "YOU DID IT KID!", timer: 240, color: "#50ff64", size: "huge" };
            playBeep(880, 420, 0.5);
          } else {
            s.voice = { text: "THE FEDS ARE COMING!", timer: 240, color: RED, size: "huge" };
            playBeep(120, 580, 0.6);
          }
        }
      }

      if (s.shakeFrames > 0) s.shakeFrames--;
      for (const k of Object.keys(s.clickFlashes)) {
        s.clickFlashes[k] = Math.max(0, s.clickFlashes[k] - 1);
      }
      if (s.voice.timer > 0) s.voice.timer--;

      // UFO phase
      if (s.gamePhase === 3) {
        s.ufoX -= 6.5;
        createSparks(s, s.ufoX + 30, s.ufoY + 60, 4, true);
        if (s.ufoX < -400) s.gameOver = true;
      }

      // ─── DRAW ───
      const [ox, oy] = getShake(s);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Grid
      ctx.strokeStyle = "#141920";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < WIDTH; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, HEIGHT); ctx.stroke();
      }
      for (let gy = 0; gy < HEIGHT; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(WIDTH, gy); ctx.stroke();
      }

      drawMachine(ctx, s, ox, oy);
      if (s.gamePhase >= 2) drawTeleportPanel(ctx, s, ox, oy);

      // Arcs
      for (const a of s.arcs) {
        if (a.life > 0) drawArc(ctx, a.x1 + ox, a.y1 + oy, a.x2 + ox, a.y2 + oy, a.color);
      }

      // Particles
      for (const p of s.particles) {
        if (p.life <= 0) continue;
        const t = p.life / p.maxLife;
        const sz = Math.max(1, Math.floor(p.size * t));
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      drawVoltmeter(ctx, s, ox, oy);

      // Title
      glowText(ctx, "MADMAN MIKE'S", 70 + ox, 36 + oy, GOLD, 36, true, s.tick);
      glowText(ctx, "FREE ENERGY DEVICE", 340 + ox, 36 + oy, GOLD, 36, true, s.tick);

      // Instructions
      if (!s.gameOver && s.gamePhase >= 1) {
        ctx.fillStyle = "#5a645a";
        ctx.font = "15px Consolas, monospace";
        ctx.fillText(
          s.gamePhase === 1
            ? "CLICK SPARK • HAMMER • PLATES  │  BUILD COMBO  │  ESC to exit"
            : "CHARGE >95% → ACTIVATE  │  BOOST BUTTONS  │  ESC to exit",
          70, HEIGHT - 10
        );
      }

      // Teleport rings
      if (s.teleporting) {
        for (let i = 0; i < 22; i++) {
          const r = 40 + i * 22 + Math.floor(15 * Math.sin(((s.teleTimer * 4 + i * 18) % 360) * Math.PI / 180));
          ctx.strokeStyle = `rgba(100,240,255,0.1)`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(WIDTH / 2, HEIGHT / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // UFO
      if (s.gamePhase === 3) drawUFO(ctx, s.ufoX + ox, s.ufoY + oy, s.tick);

      // Voice popup
      if (s.voice.timer > 0) {
        const fs = s.voice.size === "huge" ? 52 : 36;
        ctx.font = `bold ${fs}px Consolas, monospace`;
        const tw = ctx.measureText(s.voice.text).width;
        glowText(ctx, s.voice.text, WIDTH / 2 - tw / 2, HEIGHT / 2 - 80, s.voice.color, fs, true, s.tick);
      }

      // Game over overlay
      if (s.gameOver && s.gamePhase !== 3) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        if (s.teleSuccess) {
          glowText(ctx, "TELEPORT SUCCESSFUL!", WIDTH / 2 - 280, HEIGHT / 2 - 80, "#50ff64", 36, true, s.tick);
        } else {
          glowText(ctx, "DEVICE MELTDOWN", WIDTH / 2 - 220, HEIGHT / 2 - 80, RED, 36, true, s.tick);
        }

        // Stats
        ctx.fillStyle = "#8a9a9a";
        ctx.font = "16px Consolas, monospace";
        ctx.fillText(`Total Clicks: ${s.totalClicks}  │  Peak Combo: ×${s.peakCombo}  │  Final Volts: ${formatVolts(s.volts)}`, WIDTH / 2 - 280, HEIGHT / 2 + 40);

        ctx.fillStyle = "#c8c8c8";
        ctx.font = "22px Consolas, monospace";
        ctx.fillText("[ R ] — RESTART    [ ESC ] — EXIT", WIDTH / 2 - 210, HEIGHT / 2 + 100);
      }

      // Phase transition banner
      if (s.phaseChangeTimer > 0) {
        drawPhaseTransition(ctx, s.phaseChangeTimer, s.tick);
      }

      // Close button (always visible)
      drawCloseButton(ctx, s.hoveredZone === "close");

      // Tooltip for hovered zone
      if (s.hoveredZone && s.hoveredZone !== "close" && !s.hoveredZone.startsWith("tele_") && CLICK_ZONES[s.hoveredZone]) {
        const zone = CLICK_ZONES[s.hoveredZone];
        drawTooltip(ctx, zone.label, zone.hint, mouseRef.current.x, mouseRef.current.y);
      }

      // Intro overlay (drawn last)
      if (s.gamePhase === 0) {
        drawIntro(ctx, s.introTimer, s.tick);
      }

      drawCRT(ctx);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { stateRef.current.hoveredZone = null; }}
        onTouchStart={handleTouch}
        className="max-w-full max-h-full cursor-crosshair rounded-lg shadow-2xl shadow-emerald-500/20 border border-emerald-900/40"
        style={{ imageRendering: "auto", touchAction: "none" }}
      />
    </div>
  );
};
