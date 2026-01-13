export interface Point {
  x: number;
  y: number;
}

export enum PrankState {
  IDLE = 'IDLE',
  ENTERING = 'ENTERING', // Hand appearing
  GRABBING = 'GRABBING', // Hand closing on cursor
  DRAGGING = 'DRAGGING', // Hand moving cursor away
  LEAVING = 'LEAVING',   // Hand disappearing
  COOLDOWN = 'COOLDOWN'  // Brief pause before prank can happen again
}

export interface Dimensions {
  width: number;
  height: number;
  top: number;
  left: number;
}