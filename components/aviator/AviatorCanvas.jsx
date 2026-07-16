"use client";

import { useEffect, useRef, useState } from "react";

export default function AviatorCanvas({ phase, elapsedMs, currentMultiplier, crashPoint, timer }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef([]);
  const lastTimeRef = useRef(Date.now());
  const crashFlashRef = useRef(0); // For flash effect on crash

  // Track state in refs for use in the requestAnimationFrame loop without stale closures
  const stateRef = useRef({ phase, elapsedMs, currentMultiplier, crashPoint, timer });
  useEffect(() => {
    stateRef.current = { phase, elapsedMs, currentMultiplier, crashPoint, timer };
    if (phase === 'CRASHED') {
      crashFlashRef.current = 1.0; // Trigger crash flash
    }
  }, [phase, elapsedMs, currentMultiplier, crashPoint, timer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle class helper
    const spawnParticle = (x, y, angle) => {
      const speed = 1.5 + Math.random() * 2.5;
      const spread = (Math.random() - 0.5) * 0.4;
      particlesRef.current.push({
        x,
        y,
        vx: -Math.cos(angle + spread) * speed,
        vy: -Math.sin(angle + spread) * speed,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.4 ? "#f59e0b" : Math.random() > 0.5 ? "#ef4444" : "#fef08a" // orange, red, yellow
      });
    };

    // Animation Loop
    const draw = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const { phase: currentPhase, elapsedMs: currentElapsed, currentMultiplier: mult } = stateRef.current;
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw Dark Background
      ctx.fillStyle = "#0c1520";
      ctx.fillRect(0, 0, width, height);

      const startX = 40;
      const startY = height - 40;
      const plotWidth = width - startX - 40;
      const plotHeight = height - startY - 40; // negative height scale

      // Draw Radial Beams in the background
      const drawRadialBeams = () => {
        ctx.save();
        const numBeams = 6;
        const beamAngleWidth = 0.12; // angle width in radians
        const maxRadius = Math.max(width, height) * 1.5;
        const rotationOffset = (now * 0.00008) % (Math.PI * 2);
        
        ctx.fillStyle = 'rgba(225, 29, 72, 0.02)'; // subtle rose/pink beams
        for (let i = 0; i < numBeams; i++) {
          const baseAngle = (i * (Math.PI / 2) / numBeams) + rotationOffset;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.arc(startX, startY, maxRadius, -baseAngle - beamAngleWidth, -baseAngle + beamAngleWidth);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };
      drawRadialBeams();

      // Draw Grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Axis Lines (Bottom and Left borders)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, 20);
      ctx.lineTo(startX, startY);
      ctx.lineTo(width - 20, startY);
      ctx.stroke();

      // Draw Axis Ticks (dots)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      // Vertical axis dots
      for (let y = startY - 40; y > 30; y -= 45) {
        ctx.beginPath();
        ctx.arc(startX, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Horizontal axis dots
      for (let x = startX + 45; x < width - 30; x += 55) {
        ctx.beginPath();
        ctx.arc(x, startY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic scales and calculations
      const t = currentElapsed / 1000;
      const maxTime = Math.max(8, t);

      // Plane coordinate calculators
      const getPlaneCoords = (time) => {
        // Curve: goes up and right
        const progressX = Math.min(1, time / maxTime);
        const progressY = Math.min(1, Math.pow(time / maxTime, 1.6));
        const px = startX + progressX * plotWidth;
        const py = startY + progressY * plotHeight; // plotHeight is negative
        return { x: px, y: py };
      };

      // Angle calculation
      const getPlaneAngle = (time) => {
        const c1 = getPlaneCoords(time - 0.05);
        const c2 = getPlaneCoords(time);
        return Math.atan2(c2.y - c1.y, c2.x - c1.x);
      };

      // Draw Static Indicators (Lobby players count pill & cellular connection bars)
      const drawStatusIndicators = () => {
        ctx.save();
        // 👤 199 pill background
        ctx.fillStyle = "rgba(16, 27, 38, 0.6)";
        ctx.beginPath();
        ctx.roundRect(15, 15, 68, 22, 11);
        ctx.fill();

        // 👤 199 text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Outfit, Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("👤 199", 23, 26);

        // Cellular signal strength bars
        const barX = width - 35;
        const barY = 18;
        ctx.fillStyle = "#22c55e"; // bright green signal
        ctx.fillRect(barX, barY + 8, 3, 4);
        ctx.fillRect(barX + 5, barY + 4, 3, 8);
        ctx.fillRect(barX + 10, barY, 3, 12);
        ctx.restore();
      };
      drawStatusIndicators();

      // Speaker Icon on bottom right
      const drawSpeakerIcon = () => {
        ctx.save();
        const speakerX = width - 30;
        const speakerY = height - 52;
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.moveTo(speakerX, speakerY + 3);
        ctx.lineTo(speakerX + 2, speakerY + 3);
        ctx.lineTo(speakerX + 5, speakerY);
        ctx.lineTo(speakerX + 5, speakerY + 8);
        ctx.lineTo(speakerX + 2, speakerY + 5);
        ctx.lineTo(speakerX, speakerY + 5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(speakerX + 5, speakerY + 4, 3, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.restore();
      };
      drawSpeakerIcon();

      // Draw Round ID
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      const displayRoundId = stateRef.current.roundId 
        ? `Round ID: ${stateRef.current.roundId.replace('AV-', '9040.')}` 
        : "Round ID: 9040.0AA587B3D";
      ctx.fillText(displayRoundId, width - 20, height - 12);
      ctx.restore();

      if (currentPhase === 'BETTING') {
        // Show Countdown/Lobby screen
        ctx.fillStyle = "rgba(234, 179, 8, 0.01)";
        ctx.fillRect(0, 0, width, height);

        // Circular countdown spinner
        const timerMs = stateRef.current.timer;
        const totalDuration = 6000; // matching BETTING_DURATION
        const progress = Math.max(0, timerMs / totalDuration);

        const centerX = width / 2;
        const centerY = height / 2 - 20;
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#e11d48"; // Rose red countdown ring
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 24px Outfit, Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((timerMs / 1000).toFixed(1) + "s", centerX, centerY - 2);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 10px Outfit, Inter, sans-serif";
        ctx.fillText("WAITING FOR NEXT ROUND", centerX, centerY + 80);

      } else if (currentPhase === 'FLYING' || currentPhase === 'CRASHED') {
        const coords = getPlaneCoords(t);
        const angle = getPlaneAngle(t);

        // 1. Draw glowing curve path
        ctx.strokeStyle = "rgba(225, 29, 72, 0.85)"; // glowing rose line
        ctx.lineWidth = 4.5;
        ctx.shadowColor = "rgba(225, 29, 72, 0.6)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Draw the line as segments
        const segments = 60;
        for (let i = 0; i <= segments; i++) {
          const stepTime = (t * i) / segments;
          const pt = getPlaneCoords(stepTime);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        
        // Reset shadows
        ctx.shadowBlur = 0;

        // 2. Draw red/purple shaded area under curve
        const gradient = ctx.createLinearGradient(startX, startY, startX, 0);
        gradient.addColorStop(0, "rgba(225, 29, 72, 0.0)");
        gradient.addColorStop(1, "rgba(225, 29, 72, 0.16)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 0; i <= segments; i++) {
          const stepTime = (t * i) / segments;
          const pt = getPlaneCoords(stepTime);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(coords.x, startY);
        ctx.closePath();
        ctx.fill();

        // 3. Update & Draw smoke/sparks particles
        if (currentPhase === 'FLYING' && Math.random() > 0.2) {
          spawnParticle(coords.x - Math.cos(angle) * 15, coords.y - Math.sin(angle) * 15, angle);
        }

        particlesRef.current.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          if (p.life <= 0) return;
          
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0; // reset
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // 4. Draw Airplane (Propeller Plane style)
        if (currentPhase === 'FLYING') {
          ctx.save();
          ctx.translate(coords.x, coords.y);
          ctx.rotate(angle);

          const propAngle = (now / 35) % (Math.PI * 2);

          // Draw propeller line at the nose (front is right)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(18, -Math.sin(propAngle) * 9);
          ctx.lineTo(18, Math.sin(propAngle) * 9);
          ctx.stroke();

          // Draw propeller center spinner
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(18, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Fuselage (body)
          ctx.fillStyle = '#ff2a5f'; // bpexch plane red
          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 14, 5.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Cockpit glass
          ctx.fillStyle = '#93c5fd';
          ctx.beginPath();
          ctx.ellipse(3, -2, 5, 2.2, -0.3, 0, Math.PI * 2);
          ctx.fill();

          // Main top Wing (angled backwards)
          ctx.fillStyle = '#ff2a5f';
          ctx.beginPath();
          ctx.moveTo(-1, -3);
          ctx.lineTo(-5, -16);
          ctx.lineTo(1, -16);
          ctx.lineTo(4, -3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Bottom Wing (shadowed/darker red)
          ctx.fillStyle = '#9f1239';
          ctx.beginPath();
          ctx.moveTo(-1, 3);
          ctx.lineTo(-5, 13);
          ctx.lineTo(1, 13);
          ctx.lineTo(4, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Tail Fin
          ctx.fillStyle = '#ff2a5f';
          ctx.beginPath();
          ctx.moveTo(-10, -2);
          ctx.lineTo(-16, -9);
          ctx.lineTo(-12, -9);
          ctx.lineTo(-7, -2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }

        // 5. Draw big Multiplier inside screen
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (currentPhase === 'FLYING') {
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 68px Outfit, Inter, sans-serif";
          ctx.fillText(mult.toFixed(2) + " x", width / 2, height / 2 - 20);
        } else {
          // CRASHED state: explosion + "FLEW AWAY"
          ctx.fillStyle = "#ef4444";
          ctx.font = "900 48px Outfit, Inter, sans-serif";
          ctx.fillText("FLEW AWAY", width / 2, height / 2 - 40);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 28px Outfit, Inter, sans-serif";
          ctx.fillText(`@ ${stateRef.current.crashPoint.toFixed(2)} x`, width / 2, height / 2 + 10);

          // Flash overlay on crash
          if (crashFlashRef.current > 0) {
            ctx.fillStyle = `rgba(239, 68, 68, ${0.25 * crashFlashRef.current})`;
            ctx.fillRect(0, 0, width, height);
            crashFlashRef.current -= dt * 2.0; // fade flash in 0.5s
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    lastTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
