import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';
import { Language } from '../types';

interface BonusRunnerGameProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onEarnBonusPoints?: (points: number) => void;
}

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export const BonusRunnerGame: React.FC<BonusRunnerGameProps> = ({
  isOpen,
  onClose,
  lang,
  onEarnBonusPoints,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(false);

  const stateRef = useRef<GameState>('title');
  const mutedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isHy = lang === 'hy';

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playSynth = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (mutedRef.current) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio errors
    }
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setGameState('playing');
    playSynth(520, 0.12, 'triangle');
  }, [playSynth]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stateRef.current === 'playing') setGameState('paused');
        else if (stateRef.current === 'paused') setGameState('playing');
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (stateRef.current === 'title' || stateRef.current === 'gameover') {
          e.preventDefault();
          startGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, startGame]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const held: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      held[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      held[e.code] = false;
    };
    const onBlur = () => {
      Object.keys(held).forEach((k) => {
        held[k] = false;
      });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    const player = { x: width / 2, y: height - 90, vx: 0, radius: 22 };
    const items: Array<{ x: number; y: number; vy: number; kind: 'coin' | 'hazard'; r: number }> = [];
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

    let localScore = 0;
    let spawnTimer = 0;
    let shake = 0;
    let lastTime = performance.now();
    let animId = 0;

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      if (stateRef.current === 'playing') {
        const moveLeft = held['ArrowLeft'] || held['KeyA'];
        const moveRight = held['ArrowRight'] || held['KeyD'];
        const speed = held['Space'] ? 680 : 440;

        if (moveLeft) player.vx = -speed;
        else if (moveRight) player.vx = speed;
        else player.vx *= Math.pow(0.001, dt);

        player.x += player.vx * dt;
        player.x = Math.max(player.radius + 16, Math.min(width - player.radius - 16, player.x));

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const difficulty = Math.min(1 + localScore / 250, 2.8);
          spawnTimer = Math.max(0.22, 0.65 / difficulty);
          const isHazard = Math.random() < 0.28;
          items.push({
            x: 30 + Math.random() * (width - 60),
            y: -25,
            vy: (220 + Math.random() * 140) * difficulty,
            kind: isHazard ? 'hazard' : 'coin',
            r: isHazard ? 18 : 14,
          });
        }

        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * dt;

          const dx = it.x - player.x;
          const dy = it.y - player.y;
          const dist = Math.hypot(dx, dy);

          if (dist < it.r + player.radius) {
            if (it.kind === 'coin') {
              localScore += 10;
              setScore(localScore);
              playSynth(660 + (localScore % 200), 0.08, 'sine');
              for (let p = 0; p < 8; p++) {
                particles.push({
                  x: it.x,
                  y: it.y,
                  vx: (Math.random() - 0.5) * 240,
                  vy: (Math.random() - 0.5) * 240,
                  life: 0.35,
                  color: '#10b981',
                });
              }
              items.splice(i, 1);
              continue;
            } else {
              shake = 14;
              playSynth(140, 0.25, 'sawtooth');
              setHighScore((prev) => Math.max(prev, localScore));
              if (localScore > 0 && onEarnBonusPoints) {
                onEarnBonusPoints(Math.floor(localScore / 10));
              }
              items.length = 0;
              setGameState('gameover');
              break;
            }
          }

          if (it.y > height + 40) {
            items.splice(i, 1);
          }
        }
      }

      ctx.save();
      if (shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= Math.pow(0.01, dt);
      }

      // Draw items
      for (const it of items) {
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fillStyle = it.kind === 'coin' ? '#10b981' : '#f43f5e';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = it.kind === 'coin' ? '#a7f3d0' : '#fecdd3';
        ctx.stroke();
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 2.5;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;

      // Draw player cart
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fde68a';
      ctx.stroke();

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      player.y = height - 90;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, playSynth, onEarnBonusPoints]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 select-none overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Perimeter HUD */}
      <div className="fixed top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-4 pointer-events-auto">
          <div>
            <div className="text-[10px] uppercase text-slate-400">{isHy ? 'Միավորներ' : 'Счёт'}</div>
            <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">{score}</div>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <div className="text-[10px] uppercase text-slate-400">{isHy ? 'Ռեկորդ' : 'Рекорд'}</div>
            <div className="text-lg font-mono font-bold text-amber-400 tabular-nums">{highScore}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-rose-950 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isHy ? 'Ելք' : 'Выход'}</span>
          </button>
        </div>
      </div>

      {/* Title / Pause / Game Over Overlay */}
      {gameState !== 'playing' && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <svg viewBox="0 0 240 48" className="w-48 h-10 mx-auto">
              <text x="120" y="34" textAnchor="middle" fill="#f59e0b" fontSize="26" fontWeight="900" fontFamily="sans-serif">
                BONUS 2000
              </text>
            </svg>

            <h3 className="text-lg font-bold text-white">
              {gameState === 'title'
                ? (isHy ? 'Բոնուս-Ռաններ 2000' : 'Бонус-Раннер 2000')
                : gameState === 'paused'
                ? (isHy ? 'Դադար' : 'Пауза')
                : (isHy ? 'Խաղն ավարտվեց' : 'Игра окончена')}
            </h3>

            {gameState === 'gameover' && (
              <p className="text-xs text-emerald-400 font-semibold">
                {isHy
                  ? `Դուք վաստակեցիք +${Math.floor(score / 10)} բոնուսային միավոր:`
                  : `Вы заработали +${Math.floor(score / 10)} бонусных баллов!`}
              </p>
            )}

            <button
              type="button"
              onClick={gameState === 'paused' ? () => setGameState('playing') : startGame}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {gameState === 'paused' ? <Play className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              <span>
                {gameState === 'paused'
                  ? (isHy ? 'Շարունակել' : 'Продолжить')
                  : (isHy ? 'Սկսել խաղը' : 'Начать игру')}
              </span>
            </button>

            <p className="text-[11px] text-slate-400 font-mono">
              ← → / A D {isHy ? 'Շարժում' : 'Движение'} · Space {isHy ? 'Արագացում' : 'Рывок'} · Esc {isHy ? 'Դադար' : 'Пауза'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
