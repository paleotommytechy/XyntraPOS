import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Zap, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  z: number; // 3D depth
  size: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  color: string;
  alpha: number;
}

export function RetailHero3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const [activeTab, setActiveTab] = useState<'checkout' | 'inventory' | 'crm'>('checkout');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse movement listener for 3D parallax tilt
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      mouseRef.current.targetX = (relX / (rect.width / 2)) * 0.4;
      mouseRef.current.targetY = (relY / (rect.height / 2)) * 0.4;
    };

    const containerEl = containerRef.current;
    if (containerEl) {
      containerEl.addEventListener('mousemove', handleMouseMove);
    }

    // 3D Particles initialization
    const particlesCount = 70;
    const particles: Particle[] = [];
    const colors = ['#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#38bdf8'];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 500 + 100,
        size: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        speedZ: (Math.random() - 0.5) * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    let angle = 0;

    // Helper for 3D perspective projection
    const project3D = (x: number, y: number, z: number, rotX: number, rotY: number) => {
      // Rotate Y
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;

      // Rotate X
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;

      const fov = 400;
      const scale = fov / (fov + z2 + 250);
      const px = width / 2 + x1 * scale;
      const py = height / 2.2 + y2 * scale;

      return { x: px, y: py, scale, z: z2 };
    };

    const render = () => {
      // Smooth interpolation for mouse tilt
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const rotY = angle * 0.2 + mouseRef.current.x;
      const rotX = 0.45 + mouseRef.current.y;

      ctx.clearRect(0, 0, width, height);

      // Render 3D Perspective Grid Floor
      const gridSize = 10;
      const spacing = 45;
      ctx.lineWidth = 1;

      for (let i = -gridSize; i <= gridSize; i++) {
        // Lines parallel to X
        const p1 = project3D(-gridSize * spacing, 140, i * spacing, rotX, rotY);
        const p2 = project3D(gridSize * spacing, 140, i * spacing, rotX, rotY);

        const dist = Math.abs(i) / gridSize;
        const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0)');
        grad.addColorStop(0.5, `rgba(99, 102, 241, ${0.35 * (1 - dist)})`);
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Lines parallel to Z
        const p3 = project3D(i * spacing, 140, -gridSize * spacing, rotX, rotY);
        const p4 = project3D(i * spacing, 140, gridSize * spacing, rotX, rotY);

        const gradZ = ctx.createLinearGradient(p3.x, p3.y, p4.x, p4.y);
        gradZ.addColorStop(0, 'rgba(59, 130, 246, 0)');
        gradZ.addColorStop(0.5, `rgba(99, 102, 241, ${0.35 * (1 - dist)})`);
        gradZ.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.strokeStyle = gradZ;
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // Draw Central Floating 3D POS Cube Node
      const cubeSize = 65;
      const cubeY = -20 + Math.sin(angle * 1.5) * 12; // Floating bobbing effect

      const vertices = [
        { x: -cubeSize, y: cubeY - cubeSize, z: -cubeSize },
        { x: cubeSize, y: cubeY - cubeSize, z: -cubeSize },
        { x: cubeSize, y: cubeY + cubeSize, z: -cubeSize },
        { x: -cubeSize, y: cubeY + cubeSize, z: -cubeSize },
        { x: -cubeSize, y: cubeY - cubeSize, z: cubeSize },
        { x: cubeSize, y: cubeY - cubeSize, z: cubeSize },
        { x: cubeSize, y: cubeY + cubeSize, z: cubeSize },
        { x: -cubeSize, y: cubeY + cubeSize, z: cubeSize },
      ];

      const projVertices = vertices.map((v) => project3D(v.x, v.y, v.z, rotX, rotY));

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // front
        [4, 5], [5, 6], [6, 7], [7, 4], // back
        [0, 4], [1, 5], [2, 6], [3, 7], // pillars
      ];

      // Draw Glowing Cube Edges
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#3b82f6';
      ctx.lineWidth = 2.5;

      edges.forEach(([start, end]) => {
        const p1 = projVertices[start];
        const p2 = projVertices[end];

        const edgeGrad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        edgeGrad.addColorStop(0, '#60a5fa');
        edgeGrad.addColorStop(0.5, '#a78bfa');
        edgeGrad.addColorStop(1, '#3b82f6');

        ctx.strokeStyle = edgeGrad;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw Cube Center Hologram Pulse
      const centerProj = project3D(0, cubeY, 0, rotX, rotY);
      ctx.beginPath();
      ctx.arc(centerProj.x, centerProj.y, 18 * centerProj.scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.fill();

      ctx.shadowBlur = 0; // Reset shadow for performance

      // Update and Draw Floating 3D Data Particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.z += p.speedZ;

        if (p.x < -300 || p.x > 300) p.speedX *= -1;
        if (p.y < -300 || p.y > 300) p.speedY *= -1;
        if (p.z < 50 || p.z > 500) p.speedZ *= -1;

        const proj = project3D(p.x, p.y, p.z, rotX, rotY);

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, p.size * proj.scale * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (proj.scale * 0.8);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      angle += 0.015;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (containerEl) {
        containerEl.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col justify-between p-10 lg:p-12 overflow-hidden bg-slate-950 text-white select-none"
    >
      {/* Dynamic 3D Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-85"
      />

      {/* Ambient Radial Gradient Overlays */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Header Info */}
      <div className="z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs text-blue-400 font-semibold tracking-wide shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          VERSION 1.0.0 &bull; CLOUD POS OPERATING SYSTEM
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* Center 3D Interactive Feature Display */}
      <div className="z-10 max-w-xl space-y-6 my-auto">
        <div className="space-y-3">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-blue-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm">
            The operating system for modern retail merchants.
          </h2>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed font-normal">
            Manage transactions, analyze stock in real-time, maintain customer records, and manage employee accounts in one single, responsive cloud interface.
          </p>
        </div>

        {/* Dynamic Feature Tabs & Interactive Highlights */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div
            onClick={() => setActiveTab('checkout')}
            className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md cursor-pointer ${
              activeTab === 'checkout'
                ? 'bg-blue-900/30 border-blue-500/80 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-blue-400 mb-1.5">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold text-white">Under 1s Checkout</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Ultra-fast client transactions with automated digital & print receipting.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('inventory')}
            className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-indigo-900/30 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span className="text-sm font-bold text-white">Real-time Stock</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Automated inventory deductions & instant stock alert notifications.
            </p>
          </div>
        </div>

        {/* Live Interactive Stat Ticker */}
        <div className="flex items-center justify-between p-3.5 bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Interactive Merchant POS</p>
              <p className="text-[11px] text-slate-400">Multi-location catalog & customer CRM</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            Ready
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
        <span>XyntraPOS &copy; {new Date().getFullYear()} &bull; Enterprise Merchant Suite</span>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Encrypted Cloud Security</span>
        </div>
      </div>
    </div>
  );
}
