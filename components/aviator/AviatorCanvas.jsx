"use client";

import React, { useEffect, useRef } from "react";
import { useAviatorStore } from "../../lib/useAviatorStore";

export default function AviatorCanvas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Read state via Zustand selector to prevent React re-renders on every high-frequency tick
  const gamePhase = useAviatorStore((s) => s.phase);
  const gameMultiplier = useAviatorStore((s) => s.multiplier);
  const gameTimer = useAviatorStore((s) => s.timer);
  const gameElapsed = useAviatorStore((s) => s.elapsedMs);

  // Use refs to make properties readable inside the PixiJS tickers without triggering re-runs
  const stateRef = useRef({ phase: 'INIT', multiplier: 1.00, timer: 0, elapsedMs: 0 });
  
  useEffect(() => {
    stateRef.current = {
      phase: gamePhase,
      multiplier: gameMultiplier,
      timer: gameTimer,
      elapsedMs: gameElapsed
    };
  }, [gamePhase, gameMultiplier, gameTimer, gameElapsed]);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;

    let app = null;
    let stars = [];
    let particles = [];
    let plane = null;
    let flameLine = null;
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

        // Create the application
        app = new PIXI.Application();
        await app.init({
          canvas: canvasRef.current,
          width: 800,
          height: 400,
          background: "#080c14",
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });

        const width = app.screen.width;
        const height = app.screen.height;

        // 1. Draw Cosmic Star Field Background
        const starsContainer = new PIXI.Container();
        app.stage.addChild(starsContainer);
        
        for (let i = 0; i < 120; i++) {
          const starG = new PIXI.Graphics();
          const r = Math.random();
          const size = r > 0.9 ? 2.5 : r > 0.6 ? 1.5 : 0.8;
          const alpha = 0.3 + Math.random() * 0.7;
          
          starG.circle(0, 0, size).fill({ color: 0xffffff, alpha });
          starG.x = Math.random() * width;
          starG.y = Math.random() * height;
          
          starsContainer.addChild(starG);
          stars.push({
            graphic: starG,
            speed: size * 0.4,
            baseAlpha: alpha
          });
        }

        // 2. Animated Space Grid Container
        gridContainer = new PIXI.Container();
        app.stage.addChild(gridContainer);

        const gridG = new PIXI.Graphics();
        gridContainer.addChild(gridG);

        const drawGrid = (offsetY = 0, offsetX = 0) => {
          gridG.clear();
          const gridSize = 50;
          const strokeStyle = { color: 0x1e293b, width: 1, alpha: 0.15 };
          
          // Verticals
          for (let x = (offsetX % gridSize); x < width; x += gridSize) {
            gridG.moveTo(x, 0).lineTo(x, height).stroke(strokeStyle);
          }
          // Horizontals
          for (let y = (offsetY % gridSize); y < height; y += gridSize) {
            gridG.moveTo(0, y).lineTo(width, y).stroke(strokeStyle);
          }
        };
        drawGrid(0, 0);

        // 3. Trajectory Line
        flameLine = new PIXI.Graphics();
        app.stage.addChild(flameLine);

        // 4. Aviator Red Plane Container & procedural drawing
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
                 .lineTo(-5, -28)
                 .lineTo(-12, -28)
                 .lineTo(-7, -6)
                 .fill({ color: 0xbe123c });
                  
        planeBody.moveTo(5, 6)
                 .lineTo(-5, 28)
                 .lineTo(-12, 28)
                 .lineTo(-7, 6)
                 .fill({ color: 0xbe123c });
                  
        // Tail Fin (dark rose)
        planeBody.moveTo(-18, -6)
                 .lineTo(-26, -16)
                 .lineTo(-26, -6)
                 .fill({ color: 0x9f1239 });

        planeBody.moveTo(-18, 6)
                 .lineTo(-26, 16)
                 .lineTo(-26, 6)
                 .fill({ color: 0x9f1239 });

        // Engine Propeller/Exhaust nozzle
        planeBody.rect(-28, -3, 3, 6).fill({ color: 0x475569 });

        plane.addChild(planeBody);
        plane.pivot.set(0, 0);
        plane.x = 100;
        plane.y = height - 100;
        plane.visible = false;
        app.stage.addChild(plane);

        // 5. Main Multiplier HUD Text inside Canvas
        mainMultiplierText = new PIXI.Text({
          text: "1.00x",
          style: {
            fontFamily: "Outfit, Inter, system-ui, sans-serif",
            fontSize: 60,
            fontWeight: "900",
            fill: "#ffffff",
            align: "center",
            dropShadow: {
              alpha: 0.3,
              blur: 6,
              color: "#000000",
              distance: 3
            }
          }
        });
        mainMultiplierText.anchor.set(0.5);
        mainMultiplierText.position.set(width / 2, height / 2 - 25);
        app.stage.addChild(mainMultiplierText);

        // Subtext (e.g. countdown, crash message)
        subStatusText = new PIXI.Text({
          text: "WAITING FOR NEXT ROUND",
          style: {
            fontFamily: "Outfit, Inter, system-ui, sans-serif",
            fontSize: 14,
            fontWeight: "700",
            fill: "#64748b",
            letterSpacing: 2,
            align: "center"
          }
        });
        subStatusText.anchor.set(0.5);
        subStatusText.position.set(width / 2, height / 2 + 25);
        app.stage.addChild(subStatusText);

        // 6. Emitter helper for sparks/exhaust/explosions
        const spawnFlameParticle = (x, y) => {
          const particleG = new PIXI.Graphics();
          const color = Math.random() > 0.5 ? 0xf59e0b : Math.random() > 0.4 ? 0xef4444 : 0xfef08a; // amber, red, yellow
          const size = 2 + Math.random() * 4;
          
          particleG.circle(0, 0, size).fill({ color });
          particleG.x = x - 25; // Spawn right behind engine
          particleG.y = y + (Math.random() - 0.5) * 6;
          
          const angle = Math.PI + (Math.random() - 0.5) * 0.3; // blow backwards
          const speed = 2 + Math.random() * 4;
          
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
            const color = Math.random() > 0.6 ? 0xef4444 : Math.random() > 0.5 ? 0xf97316 : Math.random() > 0.3 ? 0xfacc15 : 0x6b7280; // red, orange, yellow, grey
            const size = 3 + Math.random() * 8;
            
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

        // 7. Core Tick Loop
        let gridOffsetX = 0;
        let gridOffsetY = 0;

        app.ticker.add((ticker) => {
          tickCount++;
          const { phase, multiplier, timer, elapsedMs } = stateRef.current;
          
          // Capture phase changes for camera shakes/burst triggers
          if (phase !== lastPhase) {
            if (phase === 'FLYING') {
              cameraShakeTime = 25;
              cameraShakeIntensity = 4;
            } else if (phase === 'CRASHED') {
              cameraShakeTime = 40;
              cameraShakeIntensity = 12;
              if (plane.visible) {
                spawnExplosionBlast(plane.x, plane.y);
              }
            }
            lastPhase = phase;
          }

          // A. Stars Parallax Shift
          const flightSpeedFactor = phase === 'FLYING' ? Math.min(10, multiplier) : 0.8;
          stars.forEach(star => {
            star.graphic.x -= star.speed * flightSpeedFactor;
            star.graphic.y += star.speed * flightSpeedFactor * 0.3;
            
            // Twinkle stars subtly
            star.graphic.alpha = star.baseAlpha + Math.sin(tickCount * 0.08) * 0.15;

            // Wrap edges
            if (star.graphic.x < -10) {
              star.graphic.x = width + 10;
              star.graphic.y = Math.random() * height;
            }
            if (star.graphic.y > height + 10) {
              star.graphic.y = -10;
              star.graphic.x = Math.random() * width;
            }
          });

          // B. Scroll Coordinates Grid
          if (phase === 'FLYING') {
            gridOffsetX -= 1.5 * flightSpeedFactor;
            gridOffsetY += 0.5 * flightSpeedFactor;
            drawGrid(gridOffsetY, gridOffsetX);
          } else {
            gridOffsetX -= 0.15;
            gridOffsetY += 0.05;
            drawGrid(gridOffsetY, gridOffsetX);
          }

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

          // D. Plane Flight Curve Drawing & Mechanics
          if (phase === 'FLYING') {
            plane.visible = true;
            
            // Calculate progress along bezier flight path (maxing screen space at 8.5 seconds)
            const t = elapsedMs / 1000;
            const progress = Math.min(0.9, t / 8.5);
            
            // Bezier points
            const startX = 60;
            const startY = height - 60;
            const controlX = width * 0.4;
            const controlY = height - 60;
            const endX = width - 80;
            const endY = 80;

            // Cubic bezier coordinates calculation
            const u = 1 - progress;
            const px = u * u * startX + 2 * u * progress * controlX + progress * progress * endX;
            const py = u * u * startY + 2 * u * progress * controlY + progress * progress * endY;

            // Apply minor micro-vibration
            const vibrationX = (Math.random() - 0.5) * 1.1;
            const vibrationY = (Math.random() - 0.5) * 1.1;

            plane.x = px + vibrationX;
            plane.y = py + vibrationY;

            // Compute tangent angle for dynamic rotation alignment
            const tx = 2 * (1 - progress) * (controlX - startX) + 2 * progress * (endX - controlX);
            const ty = 2 * (1 - progress) * (controlY - startY) + 2 * progress * (endY - controlY);
            plane.rotation = Math.atan2(ty, tx);

            // Draw glowing smoke path trailing from plane tail
            flameLine.clear();
            const strokeColor = multiplier > 10.0 ? 0xf59e0b : multiplier > 2.0 ? 0x8b5cf6 : 0x06b6d4; // Gold, purple, cyan
            flameLine.moveTo(startX, startY);
            flameLine.quadraticCurveTo(controlX, controlY, px, py);
            flameLine.stroke({ color: strokeColor, width: 3.5, alpha: 0.65 });

            // Spawn fire spark exhaust tail
            if (tickCount % 2 === 0) {
              spawnFlameParticle(px, py);
            }

            // HUD UI texts
            mainMultiplierText.text = `${multiplier.toFixed(2)}x`;
            mainMultiplierText.style.fill = "#ffffff";
            subStatusText.text = "PLANE IS FLYING... MULTIPLIER LIVE";
            subStatusText.style.fill = "#10b981";
          } 
          else if (phase === 'BETTING') {
            plane.visible = false;
            flameLine.clear();
            
            // Countdown HUD
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

        // 8. Handle responsiveness resize automatically
        const handleResize = () => {
          if (!containerRef.current || !app) return;
          const rect = containerRef.current.getBoundingClientRect();
          app.renderer.resize(rect.width, rect.height);
          mainMultiplierText.position.set(rect.width / 2, rect.height / 2 - 25);
          subStatusText.position.set(rect.width / 2, rect.height / 2 + 25);
        };
        
        window.addEventListener("resize", handleResize);
        setTimeout(handleResize, 100); // trigger quick resize once mounted

      } catch (err) {
        console.error("Failed to load or execute PixiJS v8 engine:", err);
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
      className="relative w-full h-[260px] sm:h-[350px] md:h-[400px] bg-[#080c14] border border-[#2c3746] rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Dynamic glow overlays inside panel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-gray-800 text-[10px] text-gray-400 font-extrabold uppercase select-none z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        Live Engine Status: 60 FPS
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
