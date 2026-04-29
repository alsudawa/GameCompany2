// 모든 스테이지 모음.
import { STAGE_GATE }   from './stage_gate.js';
import { STAGE_FOREST } from './stage_forest.js';
import { STAGE_PASS }   from './stage_pass.js';
import { STAGE_CRYPT }  from './stage_crypt.js';
import { STAGE_THRONE } from './stage_throne.js';

export const STAGES = [
  STAGE_GATE,
  STAGE_FOREST,
  STAGE_PASS,
  STAGE_CRYPT,
  STAGE_THRONE,
];

export function getStage(id) {
  return STAGES.find(s => s.id === id) ?? STAGE_GATE;
}
