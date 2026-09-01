import Anthropic from '@anthropic-ai/sdk';

// Cliente de Anthropic — SOLO se importa desde código de servidor (Route Handlers), nunca
// desde un componente 'use client'. La clave vive en ANTHROPIC_API_KEY (servidor). Sin el
// modelo en env var (AI_MODEL) no arranca — nunca un modelo hardcodeado (30-INTEGRACION-IA.md).
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AI_MODEL = process.env.AI_MODEL ?? 'claude-haiku-4-5';
