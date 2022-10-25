/* eslint-disable */
import {CanvasTexture} from 'three';

export const generateStarTexture = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  const b = 128;
  canvas.width = canvas.height = b;

  const x = b / 2;
  const y = b / 2;
  const r0 = 0;
  const r1 = b / 2;

  const gradient = context.createRadialGradient(x, y, r0, x, y, r1);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1)');
  // gradient.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, b, b);

  return new CanvasTexture(canvas);
}