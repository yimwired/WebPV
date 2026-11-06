/**
 * The three golds. They live apart from the scene so the page can name them
 * without a static import pulling three.js out of its lazy chunk.
 */
export interface Finish {
  color: string;
  roughness: number;
}

export const ROSE: Finish = { color: "#e9b296", roughness: 0.2 };
export const WHITE: Finish = { color: "#e6e6e8", roughness: 0.16 };
export const YELLOW: Finish = { color: "#e8bf6c", roughness: 0.22 };
