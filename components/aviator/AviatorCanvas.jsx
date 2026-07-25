"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAviatorStore } from "../../lib/useAviatorStore";

export default function AviatorCanvas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef(null);

  // Read state via Zustand selector to prevent React re-renders on every high-frequency tick
  const gamePhase = useAviatorStore((s) => s.phase);
  const gameMultiplier = useAviatorStore((s) => s.multiplier);
  const gameTimer = useAviatorStore((s) => s.timer);
  const gameElapsed = useAviatorStore((s) => s.elapsedMs);

  // Use refs to make properties readable inside PixiJS tickers without triggering re-runs
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
      if (!ctx || ctx.state === 'suspended') {
        ctx?.resume();
      }
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'TAKEOFF') {
        // Ascending jet motor sweep
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
        // Explosive low drop sound
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
      // Ignore audio context autoplay restriction errors
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;

    let app = null;
    let stars = [];
    let particles = [];
    let plane = null;
    let curveFill = null;
    let flameLine = null;
    let axisG = null;
    let gridContainer = null;
    let mainMultiplierText = null;
    let subStatusText = null;
    
    let cameraShakeTime = 0;
    let cameraShakeIntensity = 0;
    let tickCount = 0;
    let lastPhase = 'INIT';

    const initPixi = async () => {
      try {
        const PIXI = await import("pixi.js");

        // Create the Pixi application
        app = new PIXI.Application();
        await app.init({
          canvas: canvasRef.current,
          width: containerRef.current ? containerRef.current.clientWidth : 800,
          height: containerRef.current ? containerRef.current.clientHeight : 350,
          background: "#080c14",
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });

        const initialSw = app.screen.width;
        const initialSh = app.screen.height;

        // 1. Draw Cosmic Star Field Background
        const starsContainer = new PIXI.Container();
        app.stage.addChild(starsContainer);
        
        for (let i = 0; i < 110; i++) {
          const starG = new PIXI.Graphics();
          const r = Math.random();
          const size = r > 0.9 ? 2.2 : r > 0.6 ? 1.4 : 0.8;
          const alpha = 0.25 + Math.random() * 0.7;
          
          starG.circle(0, 0, size).fill({ color: 0xffffff, alpha });
          starG.x = Math.random() * initialSw;
          starG.y = Math.random() * initialSh;
          
          starsContainer.addChild(starG);
          stars.push({
            graphic: starG,
            speed: size * 0.35,
            baseAlpha: alpha
          });
        }

        // 2. Subtle Static Border Axes Line
        axisG = new PIXI.Graphics();
        app.stage.addChild(axisG);

        const drawAxes = (sw, sh) => {
          axisG.clear();
          const startX = Math.max(35, sw * 0.08);
          const startY = sh - Math.max(35, sh * 0.12);
          
          // Bottom horizontal axis line
          axisG.moveTo(startX, startY).lineTo(sw - 15, startY)
               .stroke({ color: 0x1e293b, width: 1.5, alpha: 0.6 });
          
          // Left vertical axis line
          axisG.moveTo(startX, 15).lineTo(startX, startY)
               .stroke({ color: 0x1e293b, width: 1.5, alpha: 0.6 });
        };

        // 3. Shaded Area Under Flight Path
        curveFill = new PIXI.Graphics();
        app.stage.addChild(curveFill);

        // 4. Trajectory Line
        flameLine = new PIXI.Graphics();
        app.stage.addChild(flameLine);

        // 5. Aviator Red Plane Container & procedural drawing
        plane = new PIXI.Container();
        const planeBody = new PIXI.Graphics();
        
        // Crimson Red plane body
        planeBody.moveTo(25, 0)
                 .lineTo(20, -5)
                 .lineTo(0, -6)
                 .lineTo(-20, -6)
                 .lineTo(-25, -2)
                 .lineTo(-25, 2)
                 .lineTo(-20, 6)
                 .lineTo(0, 6)
                 .lineTo(20, 5)
                 .fill({ color: 0xe11d48 });
                  
        // Cockpit canopy (cyan blue gloss)
        planeBody.moveTo(10, -3)
                 .lineTo(5, -6)
                 .lineTo(-2, -6)
                 .lineTo(-4, -3)
                 .fill({ color: 0x06b6d4 });
                  
        // Wings (rose wing tops)
        planeBody.moveTo(5, -6)
                 .lineTo(-5, -26)
                 .lineTo(-12, -26)
                 .lineTo(-7, -6)
                 .fill({ color: 0xbe123c });
                  
        planeBody.moveTo(5, 6)
                 .lineTo(-5, 26)
                 .lineTo(-12, 26)
                 .lineTo(-7, 6)
                 .fill({ color: 0xbe123c });
                  
        // Tail Fin (dark rose)
        planeBody.moveTo(-18, -6)
                 .lineTo(-26, -15)
                 .lineTo(-26, -6)
                 .fill({ color: 0x9f1239 });

        planeBody.moveTo(-18, 6)
                 .lineTo(-26, 15)
                 .lineTo(-26, 6)
                 .fill({ color: 0x9f1239 });

        // Engine Propeller/Exhaust nozzle
        planeBody.rect(-28, -3, 3, 6).fill({ color: 0x475569 });

        plane.addChild(planeBody);
        plane.pivot.set(0, 0);
        plane.visible = false;
        app.stage.addChild(plane);

        // 6. Main Multiplier HUD Text inside Canvas
        mainMultiplierText = new PIXI.Text({
          text: "1.00x",
          style: {
            fontFamily: "Outfit, Inter, system-ui, sans-serif",
            fontSize: 54,
            fontWeight: "900",
            fill: "#ffffff",
            align: "center",
            dropShadow: {
              alpha: 0.35,
              blur: 8,
              color: "#000000",
              distance: 3
            }
          }
        });
        mainMultiplierText.anchor.set(0.5);
        mainMultiplierText.position.set(initialSw / 2, initialSh / 2 - 20);
        app.stage.addChild(mainMultiplierText);

        // Subtext (e.g. countdown, crash message)
        subStatusText = new PIXI.Text({
          text: "WAITING FOR NEXT ROUND",
          style: {
            fontFamily: "Outfit, Inter, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: "800",
            fill: "#64748b",
            letterSpacing: 2,
            align: "center"
          }
        });
        subStatusText.anchor.set(0.5);
        subStatusText.position.set(initialSw / 2, initialSh / 2 + 25);
        app.stage.addChild(subStatusText);

        // 7. Emitter helper for sparks/exhaust/explosions
        const spawnFlameParticle = (x, y) => {
          const particleG = new PIXI.Graphics();
          const color = Math.random() > 0.5 ? 0xf59e0b : Math.random() > 0.4 ? 0xef4444 : 0xfef08a; // amber, red, yellow
          const size = 2 + Math.random() * 3.5;
          
          particleG.circle(0, 0, size).fill({ color });
          particleG.x = x - 18; // Spawn behind engine
          particleG.y = y + (Math.random() - 0.5) * 5;
          
          const angle = Math.PI + (Math.random() - 0.5) * 0.35;
          const speed = 2 + Math.random() * 3.5;
          
          app.stage.addChild(particleG);
          particles.push({
            graphic: particleG,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.03 + Math.random() * 0.04
          });
        };

        const spawnExplosionBlast = (x, y) => {
          for (let i = 0; i < 90; i++) {
            const particleG = new PIXI.Graphics();
            const color = Math.random() > 0.6 ? 0xef4444 : Math.random() > 0.5 ? 0xf97316 : Math.random() > 0.3 ? 0xfacc15 : 0x6b7280;
            const size = 2.5 + Math.random() * 7;
            
            particleG.circle(0, 0, size).fill({ color });
            particleG.x = x;
            particleG.y = y;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 6.5;
            
            app.stage.addChild(particleG);
            particles.push({
              graphic: particleG,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              decay: 0.015 + Math.random() * 0.02
            });
          }
        };

        // 8. Core Dynamic Tick Loop

        app.ticker.add((ticker) => {
          tickCount++;
          const { phase, multiplier, timer, elapsedMs } = stateRef.current;

          // Read dynamic Pixi canvas screen size on every tick!
          const sw = app.screen.width;
          const sh = app.screen.height;

          // Responsive plane scale based on canvas width
          const planeScale = Math.min(1.0, Math.max(0.65, sw / 600));
          plane.scale.set(planeScale);

          // Position central HUD text responsively
          mainMultiplierText.position.set(sw / 2, sh / 2 - 20);
          subStatusText.position.set(sw / 2, sh / 2 + 25);
          
          const fontMultiplierSize = Math.min(64, Math.max(34, Math.floor(sw * 0.13)));
          mainMultiplierText.style.fontSize = fontMultiplierSize;
          const fontSubSize = Math.min(13, Math.max(10, Math.floor(sw * 0.032)));
          subStatusText.style.fontSize = fontSubSize;
          
          // Phase Change Audio & FX triggers
          if (phase !== lastPhase) {
            if (phase === 'FLYING') {
              cameraShakeTime = 25;
              cameraShakeIntensity = 4;
              playSoundEffect('TAKEOFF', multiplier);
            } else if (phase === 'CRASHED') {
              cameraShakeTime = 40;
              cameraShakeIntensity = 12;
              playSoundEffect('CRASH');
              if (plane.visible) {
                spawnExplosionBlast(plane.x, plane.y);
              }
            }
            lastPhase = phase;
          }

          // A. Stars Parallax Shift
          const flightSpeedFactor = phase === 'FLYING' ? Math.min(8, multiplier) : 0.8;
          stars.forEach(star => {
            star.graphic.x -= star.speed * flightSpeedFactor;
            star.graphic.y += star.speed * flightSpeedFactor * 0.3;
            star.graphic.alpha = star.baseAlpha + Math.sin(tickCount * 0.08) * 0.15;

            // Wrap edges using dynamic canvas bounds
            if (star.graphic.x < -10) {
              star.graphic.x = sw + 10;
              star.graphic.y = Math.random() * sh;
            }
            if (star.graphic.y > sh + 10) {
              star.graphic.y = -10;
              star.graphic.x = Math.random() * sw;
            }
          });

          // B. Static Border Axes
          drawAxes(sw, sh);

          // C. Particle management
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.graphic.x += p.vx;
            p.graphic.y += p.vy;
            p.life -= p.decay;
            p.graphic.alpha = p.life;
            p.graphic.scale.set(p.life);
            
            if (p.life <= 0) {
              app.stage.removeChild(p.graphic);
              p.graphic.destroy();
              particles.splice(i, 1);
            }
          }

          // D. Responsive Plane Bezier Flight Path & Trajectory
          if (phase === 'FLYING') {
            plane.visible = true;
            
            // Calculate progress along bezier flight path (capped so plane stays inside canvas)
            const t = elapsedMs / 1000;
            const progress = Math.min(0.92, t / 8.5);
            
            // DYNAMIC Bezier coordinates calculated strictly from CURRENT canvas screen bounds!
            const startX = Math.max(35, sw * 0.08);
            const startY = sh - Math.max(35, sh * 0.12);
            const controlX = sw * 0.45;
            const controlY = sh - Math.max(35, sh * 0.12);
            const endX = sw - Math.max(35, sw * 0.10);
            const endY = Math.max(35, sh * 0.15);

            // Quadratic bezier calculation
            const u = 1 - progress;
            const px = u * u * startX + 2 * u * progress * controlX + progress * progress * endX;
            const py = u * u * startY + 2 * u * progress * controlY + progress * progress * endY;

            // Apply slight flight micro-vibration
            const vibrationX = (Math.random() - 0.5) * 1.0;
            const vibrationY = (Math.random() - 0.5) * 1.0;

            plane.x = px + vibrationX;
            plane.y = py + vibrationY;

            // Tangent angle calculation for plane rotation
            const tx = 2 * (1 - progress) * (controlX - startX) + 2 * progress * (endX - controlX);
            const ty = 2 * (1 - progress) * (controlY - startY) + 2 * progress * (endY - controlY);
            plane.rotation = Math.atan2(ty, tx);

            // Draw glowing trajectory curve line & shaded polygon fill
            flameLine.clear();
            curveFill.clear();

            const strokeColor = multiplier >= 10.0 ? 0xf59e0b : multiplier >= 2.0 ? 0xa855f7 : 0x06b6d4; // Gold, Purple, Cyan
            
            // 1. Curve line stroke
            flameLine.moveTo(startX, startY);
            flameLine.quadraticCurveTo(controlX, controlY, px, py);
            flameLine.stroke({ color: strokeColor, width: 3.5, alpha: 0.85 });

            // 2. Glowing Area Fill underneath curve
            curveFill.moveTo(startX, startY);
            curveFill.quadraticCurveTo(controlX, controlY, px, py);
            curveFill.lineTo(px, startY);
            curveFill.closePath();
            curveFill.fill({ color: 0xe11d48, alpha: 0.16 });

            // Exhaust particles
            if (tickCount % 2 === 0) {
              spawnFlameParticle(px, py);
            }

            // Multiplier text formatting & color transitions
            mainMultiplierText.text = `${multiplier.toFixed(2)}x`;
            if (multiplier >= 10.0) {
              mainMultiplierText.style.fill = "#f59e0b"; // Amber Gold
            } else if (multiplier >= 2.0) {
              mainMultiplierText.style.fill = "#c084fc"; // Purple
            } else {
              mainMultiplierText.style.fill = "#ffffff";
            }
            subStatusText.text = "PLANE IS FLYING... MULTIPLIER LIVE";
            subStatusText.style.fill = "#10b981";
          } 
          else if (phase === 'BETTING') {
            plane.visible = false;
            flameLine.clear();
            curveFill.clear();
            
            const secondsLeft = (timer / 1000).toFixed(1);
            mainMultiplierText.text = `${secondsLeft}s`;
            mainMultiplierText.style.fill = "#1abc9c";
            subStatusText.text = "PREPARE FOR PLANE TAKEOFF";
            subStatusText.style.fill = "#64748b";
          } 
          else if (phase === 'CRASHED') {
            plane.visible = false;
            
            mainMultiplierText.text = `FLEW AWAY`;
            mainMultiplierText.style.fill = "#ef4444";
            subStatusText.text = `@ ${multiplier.toFixed(2)}x MULTIPLIER`;
            subStatusText.style.fill = "#f59e0b";
          } 
          else {
            plane.visible = false;
            flameLine.clear();
            curveFill.clear();
            mainMultiplierText.text = "Aviator";
            mainMultiplierText.style.fill = "#ffffff";
            subStatusText.text = "CONNECTING TO ENGINE...";
            subStatusText.style.fill = "#64748b";
          }

          // E. Cinematic Camera Shake calculations
          if (cameraShakeTime > 0) {
            cameraShakeTime--;
            const curIntensity = (cameraShakeTime / 40) * cameraShakeIntensity;
            app.stage.position.set(
              (Math.random() - 0.5) * curIntensity,
              (Math.random() - 0.5) * curIntensity
            );
          } else {
            app.stage.position.set(0, 0);
          }
        });

        // 9. Resize Listener for Canvas Container
        const handleResize = () => {
          if (!containerRef.current || !app) return;
          const rect = containerRef.current.getBoundingClientRect();
          app.renderer.resize(rect.width, rect.height);
        };
        
        window.addEventListener("resize", handleResize);
        setTimeout(handleResize, 100);

      } catch (err) {
        console.error("Failed to initialize PixiJS v8 engine:", err);
      }
    };

    initPixi();

    return () => {
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] bg-[#080c14] border border-[#2c3746] rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Dynamic radial glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Top Left Live Engine Status pill */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-gray-800 text-[10px] text-gray-300 font-extrabold uppercase select-none z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        Live Engine Status: 60 FPS
      </div>

      {/* Top Right Audio Mute / Unmute Toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 bg-black/50 backdrop-blur-md hover:bg-black/70 border border-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        title={isMuted ? "Unmute Audio" : "Mute Audio"}
      >
        {isMuted ? "🔇 Muted" : "🔊 Sound ON"}
      </button>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

