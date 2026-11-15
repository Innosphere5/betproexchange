"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAviatorStore } from "../../lib/useAviatorStore";

export default function AviatorCanvas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef(null);

  // Read state via Zustand store selectors
  const gamePhase = useAviatorStore((s) => s.phase);
  const gameMultiplier = useAviatorStore((s) => s.multiplier);
  const gameTimer = useAviatorStore((s) => s.timer);
  const gameElapsed = useAviatorStore((s) => s.elapsedMs);

  // Keep state in refs so the 60fps requestAnimationFrame loop always reads fresh data without re-mounting
  const stateRef = useRef({ phase: 'INIT', multiplier: 1.00, timer: 0, elapsedMs: 0 });
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    stateRef.current = {
      phase: gamePhase,
      multiplier: gameMultiplier,
      timer: gameTimer,
      elapsedMs: gameElapsed
    };
  }, [gamePhase, gameMultiplier, gameTimer, gameElapsed]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Web Audio Synth Helper for procedural Aviator audio FX
  const playSoundEffect = (type, param = 1) => {
    if (isMutedRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      if (type === 'TAKEOFF') {
        // Ascending jet turbine sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(320 * Math.min(2.5, param), now + 0.8);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === 'CRASH') {
        // Explosive low drop crash sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'CASHOUT') {
        // High win chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Ignore audio autoplay policy restrictions
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = null;
    let tickCount = 0;
    let lastPhase = 'INIT';
    let cameraShakeTime = 0;
    let cameraShakeIntensity = 0;

    // Responsive Canvas Resize Helper with high-DPI retina display support
    let logicalWidth = 800;
    let logicalHeight = 350;

    const resize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      logicalWidth = Math.max(300, rect.width);
      logicalHeight = Math.max(200, rect.height);

      canvas.width = Math.round(logicalWidth * dpr);
      canvas.height = Math.round(logicalHeight * dpr);
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
    };

    resize();
    window.addEventListener("resize", resize);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            resize();
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    // Initialize 120 cosmic starfield particles
    const stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 600,
        size: Math.random() > 0.85 ? 2.2 : Math.random() > 0.5 ? 1.4 : 0.8,
        speed: 0.2 + Math.random() * 0.6,
        alpha: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 0.03 + Math.random() * 0.05
      });
    }

    // Dynamic jet exhaust particles
    const particles = [];

    const spawnFlameParticle = (x, y) => {
      const angle = Math.PI + (Math.random() - 0.5) * 0.35;
      const speed = 2.0 + Math.random() * 3.5;
      particles.push({
        x: x - 18,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.035 + Math.random() * 0.04,
        size: 2.5 + Math.random() * 4.0,
        color: Math.random() > 0.5 ? "#f59e0b" : Math.random() > 0.4 ? "#ef4444" : "#fef08a" // amber, red, yellow
      });
    };

    const spawnExplosionBlast = (x, y) => {
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 6.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.018 + Math.random() * 0.025,
          size: 3.0 + Math.random() * 6.5,
          color: Math.random() > 0.6 ? "#ef4444" : Math.random() > 0.4 ? "#f97316" : "#facc15"
        });
      }
    };

    // Jet Aircraft Vector Drawer
    const drawPlane = (px, py, angle, scale) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Jet Fuselage
      ctx.fillStyle = "#e11d48"; // Crimson Red
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(20, -5);
      ctx.lineTo(0, -6);
      ctx.lineTo(-20, -6);
      ctx.lineTo(-25, -2);
      ctx.lineTo(-25, 2);
      ctx.lineTo(-20, 6);
      ctx.lineTo(0, 6);
      ctx.lineTo(20, 5);
      ctx.closePath();
      ctx.fill();

      // Cockpit Canopy (glossy cyan)
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.moveTo(10, -3);
      ctx.lineTo(5, -6);
      ctx.lineTo(-2, -6);
      ctx.lineTo(-4, -3);
      ctx.closePath();
      ctx.fill();

      // Top & Bottom Wings
      ctx.fillStyle = "#be123c"; // Darker crimson
      ctx.beginPath();
      ctx.moveTo(5, -6);
      ctx.lineTo(-5, -24);
      ctx.lineTo(-12, -24);
      ctx.lineTo(-7, -6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(5, 6);
      ctx.lineTo(-5, 24);
      ctx.lineTo(-12, 24);
      ctx.lineTo(-7, 6);
      ctx.closePath();
      ctx.fill();

      // Tail Fins
      ctx.fillStyle = "#9f1239";
      ctx.beginPath();
      ctx.moveTo(-18, -6);
      ctx.lineTo(-26, -14);
      ctx.lineTo(-26, -6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-18, 6);
      ctx.lineTo(-26, 14);
      ctx.lineTo(-26, 6);
      ctx.closePath();
      ctx.fill();

      // Thruster Nozzle
      ctx.fillStyle = "#475569";
      ctx.fillRect(-28, -3, 3, 6);

      ctx.restore();
    };

    // Main 60 FPS Canvas 2D Render Loop
    const render = () => {
      tickCount++;
      const { phase, multiplier, timer, elapsedMs } = stateRef.current;
      const w = logicalWidth;
      const h = logicalHeight;
      const dpr = window.devicePixelRatio || 1;

      // Set transform to DPR scale for ultra-sharp canvas rendering
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Detect Phase Changes for Sound and Shake Triggers
      if (phase !== lastPhase) {
        if (phase === 'FLYING') {
          cameraShakeTime = 25;
          cameraShakeIntensity = 3.5;
          playSoundEffect('TAKEOFF', multiplier);
        } else if (phase === 'CRASHED') {
          cameraShakeTime = 40;
          cameraShakeIntensity = 9.0;
          playSoundEffect('CRASH');
          // Spawn explosion at last known plane position
          const t = elapsedMs / 1000;
          const progress = Math.min(0.92, t / 8.5);
          const startX = Math.max(35, w * 0.08);
          const startY = h - Math.max(35, h * 0.12);
          const controlX = w * 0.45;
          const controlY = h - Math.max(35, h * 0.12);
          const endX = w - Math.max(35, w * 0.10);
          const endY = Math.max(35, h * 0.15);
          const u = 1 - progress;
          const lastPx = u * u * startX + 2 * u * progress * controlX + progress * progress * endX;
          const lastPy = u * u * startY + 2 * u * progress * controlY + progress * progress * endY;
          spawnExplosionBlast(lastPx, lastPy);
        }
        lastPhase = phase;
      }

      ctx.save();

      // Camera Shake
      if (cameraShakeTime > 0) {
        cameraShakeTime--;
        const curIntensity = (cameraShakeTime / 40) * cameraShakeIntensity;
        ctx.translate((Math.random() - 0.5) * curIntensity, (Math.random() - 0.5) * curIntensity);
      }

      // 1. Dark Cosmic Canvas Background
      ctx.fillStyle = "#080c14";
      ctx.fillRect(0, 0, w, h);

      // Radial center ambient glow
      const radialGlow = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      radialGlow.addColorStop(0, "rgba(225, 29, 72, 0.04)");
      radialGlow.addColorStop(1, "rgba(8, 12, 20, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, w, h);

      // 2. Starfield with Parallax Drift
      const speedFactor = phase === 'FLYING' ? Math.min(7.0, Math.max(1.0, multiplier * 0.8)) : 0.6;
      stars.forEach(star => {
        star.x -= star.speed * speedFactor;
        star.y += star.speed * speedFactor * 0.25;

        // Wrap around boundaries
        if (star.x < -10) star.x = w + 10;
        if (star.y > h + 10) star.y = -10;

        const currentAlpha = Math.max(0.1, Math.min(1.0, star.alpha + Math.sin(tickCount * star.twinkleSpeed) * 0.2));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Coordinate Axes (Bottom and Left border lines)
      const startX = Math.max(35, w * 0.08);
      const startY = h - Math.max(35, h * 0.12);

      ctx.strokeStyle = "rgba(30, 41, 59, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Left vertical axis
      ctx.moveTo(startX, 20);
      ctx.lineTo(startX, startY);
      // Bottom horizontal axis
      ctx.lineTo(w - 20, startY);
      ctx.stroke();

      // Axis ticks / dots
      ctx.fillStyle = "rgba(71, 85, 105, 0.5)";
      for (let y = startY - 35; y > 30; y -= 45) {
        ctx.beginPath();
        ctx.arc(startX, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let x = startX + 45; x < w - 25; x += 55) {
        ctx.beginPath();
        ctx.arc(x, startY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Trajectory Bezier Flight Curve & Procedural Aircraft
      if (phase === 'FLYING') {
        const t = elapsedMs / 1000;
        const progress = Math.min(0.92, t / 8.5);

        const controlX = w * 0.45;
        const controlY = h - Math.max(35, h * 0.12);
        const endX = w - Math.max(35, w * 0.10);
        const endY = Math.max(35, h * 0.15);

        // Quadratic Bezier Formula
        const u = 1 - progress;
        const px = u * u * startX + 2 * u * progress * controlX + progress * progress * endX;
        const py = u * u * startY + 2 * u * progress * controlY + progress * progress * endY;

        // Micro-flight vibration
        const vibX = (Math.random() - 0.5) * 1.0;
        const vibY = (Math.random() - 0.5) * 1.0;
        const planeX = px + vibX;
        const planeY = py + vibY;

        // Tangent angle for plane orientation
        const tx = 2 * (1 - progress) * (controlX - startX) + 2 * progress * (endX - controlX);
        const ty = 2 * (1 - progress) * (controlY - startY) + 2 * progress * (endY - controlY);
        const planeAngle = Math.atan2(ty, tx);

        // A. Shaded Glow Under Curve
        const areaGrad = ctx.createLinearGradient(0, py, 0, startY);
        areaGrad.addColorStop(0, "rgba(225, 29, 72, 0.22)");
        areaGrad.addColorStop(1, "rgba(225, 29, 72, 0.01)");
        ctx.fillStyle = areaGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, px, py);
        ctx.lineTo(px, startY);
        ctx.closePath();
        ctx.fill();

        // B. Glowing Trajectory Curve Line
        const strokeColor = multiplier >= 10.0 ? "#f59e0b" : multiplier >= 2.0 ? "#c084fc" : "#06b6d4";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, px, py);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow

        // C. Spawn Engine Exhaust Particles
        if (tickCount % 2 === 0) {
          spawnFlameParticle(planeX, planeY);
        }

        // D. Draw Procedural Red Aviator Jet Plane
        const planeScale = Math.min(1.0, Math.max(0.68, w / 650));
        drawPlane(planeX, planeY, planeAngle, planeScale);
      } else if (phase !== 'CRASHED') {
        // Idle / Betting Runway Position
        const planeScale = Math.min(1.0, Math.max(0.68, w / 650));
        drawPlane(startX + 30, startY - 14, -0.06, planeScale);
        if (phase === 'BETTING' && tickCount % 5 === 0) {
          spawnFlameParticle(startX + 10, startY - 14);
        }
      }

      // 5. Update & Render Particles (Exhaust & Explosions)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 6. Central Multiplier HUD Text Overlay
      const centerX = w / 2;
      const centerY = h / 2;
      const fontSize = Math.min(68, Math.max(36, Math.floor(w * 0.12)));

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (phase === 'FLYING') {
        const multVal = multiplier.toFixed(2);
        const multColor = multiplier >= 10.0 ? "#f59e0b" : multiplier >= 2.0 ? "#c084fc" : "#ffffff";

        ctx.font = `900 ${fontSize}px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = multColor;
        ctx.shadowColor = multColor;
        ctx.shadowBlur = multiplier >= 2.0 ? 14 : 6;
        ctx.fillText(`${multVal}x`, centerX, centerY - 14);
        ctx.shadowBlur = 0;

        ctx.font = `800 11px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = "#10b981"; // Emerald
        ctx.fillText("PLANE IS FLYING... MULTIPLIER LIVE", centerX, centerY + fontSize * 0.5 + 4);
      } else if (phase === 'BETTING') {
        const sec = (timer / 1000).toFixed(1);
        ctx.font = `900 ${fontSize}px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = "#1abc9c"; // Teal
        ctx.fillText(`${sec}s`, centerX, centerY - 14);

        ctx.font = `800 11px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = "#10b981";
        ctx.fillText("PREPARE FOR TAKEOFF • PLACE YOUR BETS", centerX, centerY + fontSize * 0.5 + 4);
      } else if (phase === 'CRASHED') {
        ctx.font = `900 ${Math.min(54, fontSize * 0.9)}px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = "#ef4444"; // Red
        ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
        ctx.shadowBlur = 16;
        ctx.fillText("FLEW AWAY", centerX, centerY - 14);
        ctx.shadowBlur = 0;

        ctx.font = `800 13px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = "#f59e0b";
        ctx.fillText(`@ ${multiplier.toFixed(2)}x MULTIPLIER`, centerX, centerY + fontSize * 0.45 + 4);
      } else {
        ctx.font = `900 ${Math.floor(fontSize * 0.75)}px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Aviator", centerX, centerY - 14);

        ctx.font = `800 11px 'Outfit', 'Inter', system-ui, sans-serif`;
        ctx.fillStyle = "#e11d48";
        ctx.fillText("WAITING FOR TAKEOFF", centerX, centerY + fontSize * 0.45 + 4);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] bg-[#080c14] border border-[#2c3746] rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Top Left Live Engine Status pill */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-gray-800 text-[10px] text-gray-300 font-extrabold uppercase select-none z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        Live Engine Status: 60 FPS
      </div>

      {/* Top Right Audio Mute / Unmute Toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 bg-black/60 backdrop-blur-md hover:bg-black/80 border border-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        title={isMuted ? "Unmute Audio" : "Mute Audio"}
      >
        {isMuted ? "🔇 Muted" : "🔊 Sound ON"}
      </button>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
