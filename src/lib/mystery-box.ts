import { MysteryBoxConfig, MysteryBoxRule } from './types';

/**
 * Calcula quantas caixas o cliente ganhou baseado na quantidade de tickets.
 * Usa a regra de escalada: o nível mais alto atingido define a quantidade total.
 * Ex: 400 → 1 caixa, 600 → 2 caixas, 1200 → 6 caixas
 */
export function getBoxesForTickets(
  ticketCount: number,
  rules: MysteryBoxRule[]
): number {
  // Ordenar do maior para o menor e pegar o primeiro que o usuário atingiu
  const sorted = [...rules].sort((a, b) => b.minTickets - a.minTickets);
  const matched = sorted.find((r) => ticketCount >= r.minTickets);
  return matched ? matched.boxes : 0;
}

/**
 * Decide se o usuário ganhou alguma coisa ao abrir uma caixa misteriosa.
 * A probabilidade é por tentativa (ex: 0.1 = 10% por caixa aberta).
 */
export function attemptMysteryBoxWin(winProbability: number): boolean {
  return Math.random() < winProbability;
}

/**
 * Retorna a próxima regra de threshold que o usuário ainda não atingiu,
 * para exibir o incentivo no checkout.
 */
export function getNextBoxIncentive(
  ticketCount: number,
  rules: MysteryBoxRule[]
): MysteryBoxRule | null {
  const sorted = [...rules].sort((a, b) => a.minTickets - b.minTickets);
  return sorted.find((r) => r.minTickets > ticketCount) ?? null;
}

/**
 * Parseia o JSON da config de mystery box com fallback seguro.
 */
export function parseMysteryBoxConfig(json: unknown): MysteryBoxConfig | null {
  if (!json || typeof json !== 'object') return null;
  const config = json as Record<string, unknown>;
  if (
    !Array.isArray(config.rules) ||
    typeof config.winProbability !== 'number'
  ) {
    return null;
  }
  return config as unknown as MysteryBoxConfig;
}
