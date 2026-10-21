'use client';

// La planta de "Tu momento Fairsy": crece con los días seguidos en que los dos responden la pregunta. Semilla →
// brote → planta → floreciendo → árbol con frutos. Dibujada en vector con los colores de la app (verde azulado y
// coral), así pesa nada y no depende de imágenes.

import { motion, useReducedMotion } from 'motion/react';

export interface EtapaPlanta {
  nivel: 0 | 1 | 2 | 3 | 4;
  nombre: string;
  /** Días que faltan para la siguiente etapa (null si ya es un árbol). */
  faltan: number | null;
}

const UMBRALES = [0, 1, 3, 7, 14] as const;
const NOMBRES = ['Semilla', 'Brote', 'Planta', 'Floreciendo', 'Árbol con frutos'];

export function etapaDeRacha(dias: number): EtapaPlanta {
  let nivel = 0;
  for (let i = 0; i < UMBRALES.length; i++) if (dias >= UMBRALES[i]) nivel = i;
  const siguiente = UMBRALES[nivel + 1];
  return { nivel: nivel as EtapaPlanta['nivel'], nombre: NOMBRES[nivel], faltan: siguiente === undefined ? null : siguiente - dias };
}

const VERDE = 'var(--accent-2)';
const VERDE_CLARO = 'var(--verde-claro)';
const CORAL = 'var(--accent)';
const AMBAR = 'var(--cat-amber)';
const TIERRA = 'color-mix(in oklab, var(--accent) 55%, var(--text-primary))';
const MACETA_BORDE = 'color-mix(in oklab, var(--accent) 78%, var(--text-primary))';

// Hoja que apunta hacia +x; `rot` la gira (−30° = arriba a la derecha, −150° = arriba a la izquierda).
function Hoja({ x, y, rot, s = 1, color = VERDE }: { x: number; y: number; rot: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C6 -11 22 -12 28 0 C22 12 6 11 0 0 Z" fill={color} />
      <path d="M2 0 L24 0" stroke="var(--bg)" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

function Maceta() {
  return (
    <g>
      <path d="M38 95 L82 95 L77 113 Q76 116 73 116 L47 116 Q44 116 43 113 Z" fill={CORAL} />
      <rect x="33" y="88" width="54" height="9" rx="3.5" fill={MACETA_BORDE} />
      <ellipse cx="60" cy="89.5" rx="22" ry="2.6" fill={TIERRA} />
    </g>
  );
}

function Tallo({ alto }: { alto: number }) {
  return <path d={`M60 90 C60 ${90 - alto * 0.4} 60 ${90 - alto * 0.7} 60 ${90 - alto}`} stroke={VERDE} strokeWidth="3.4" strokeLinecap="round" fill="none" />;
}

function Flor({ cx, cy }: { cx: number; cy: number }) {
  const petalos = [0, 72, 144, 216, 288];
  return (
    <g>
      {petalos.map((a) => (
        <circle key={a} cx={cx + 7 * Math.cos(((a - 90) * Math.PI) / 180)} cy={cy + 7 * Math.sin(((a - 90) * Math.PI) / 180)} r="5.6" fill={CORAL} />
      ))}
      <circle cx={cx} cy={cy} r="4.2" fill={AMBAR} />
    </g>
  );
}

function Contenido({ nivel }: { nivel: EtapaPlanta['nivel'] }) {
  if (nivel === 0) {
    return (
      <g>
        <ellipse cx="60" cy="86" rx="5" ry="3.4" fill={TIERRA} />
        <path d="M60 83 Q61 80 63 79" stroke={VERDE_CLARO} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (nivel === 1) {
    return (
      <g>
        <Tallo alto={20} />
        <Hoja x={60} y={72} rot={-28} s={0.8} />
        <Hoja x={60} y={72} rot={-152} s={0.8} color={VERDE_CLARO} />
      </g>
    );
  }
  if (nivel === 2 || nivel === 3) {
    return (
      <g>
        <Tallo alto={nivel === 3 ? 46 : 40} />
        <Hoja x={60} y={80} rot={-22} />
        <Hoja x={60} y={78} rot={-158} color={VERDE_CLARO} />
        <Hoja x={60} y={66} rot={-34} s={0.9} color={VERDE_CLARO} />
        <Hoja x={60} y={64} rot={-146} s={0.9} />
        <Hoja x={60} y={54} rot={-52} s={0.7} />
        <Hoja x={60} y={54} rot={-128} s={0.7} color={VERDE_CLARO} />
        {nivel === 3 ? <Flor cx={60} cy={40} /> : <Hoja x={60} y={50} rot={-90} s={0.7} />}
      </g>
    );
  }
  return (
    <g>
      <path d="M54 90 L66 90 L63 58 L57 58 Z" fill={TIERRA} />
      <circle cx="60" cy="44" r="23" fill={VERDE} />
      <circle cx="42" cy="56" r="16" fill={VERDE_CLARO} />
      <circle cx="78" cy="56" r="16" fill={VERDE_CLARO} />
      <circle cx="60" cy="52" r="15" fill={VERDE} />
      {[
        [52, 40],
        [69, 46],
        [60, 29],
        [44, 56],
        [77, 58],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" fill={CORAL} />
      ))}
    </g>
  );
}

export function PlantaRacha({ dias, className }: { dias: number; className?: string }) {
  const reducido = useReducedMotion();
  const { nivel, nombre } = etapaDeRacha(dias);
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={`Su planta: ${nombre.toLowerCase()}, ${dias} ${dias === 1 ? 'día' : 'días'} seguidos`} className={className}>
      <circle cx="60" cy="62" r="52" fill={VERDE} fillOpacity="0.08" />
      <motion.g
        key={nivel}
        initial={reducido ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        style={{ transformOrigin: '60px 100px' }}
      >
        <motion.g
          animate={reducido || nivel === 0 ? undefined : { rotate: [-1.6, 1.6, -1.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '60px 92px' }}
        >
          <Contenido nivel={nivel} />
        </motion.g>
        <Maceta />
      </motion.g>
    </svg>
  );
}
