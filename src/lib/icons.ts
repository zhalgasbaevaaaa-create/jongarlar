/** Картаға қажет кішкентай суреттерді (chevron бағдар, glow) canvas арқылы генерациялау.
 *  Сыртқы файл керек емес — офлайн жұмыс істейді. */

export interface RawImage { width: number; height: number; data: Uint8Array }

function newCanvas(w: number, h: number) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return { cv, ctx: cv.getContext("2d")! };
}
function toImg(cv: HTMLCanvasElement): RawImage {
  const ctx = cv.getContext("2d")!;
  const id = ctx.getImageData(0, 0, cv.width, cv.height);
  return { width: id.width, height: id.height, data: new Uint8Array(id.data.buffer.slice(0)) };
}

/** «❯» тәрізді бағдар белгісі; heading = 0 (солтүстікке қараған) күйде салынады,
 *  ал қабатта icon-rotate бұрады. */
export function makeChevron(color: string): RawImage {
  const S = 64;
  const { cv, ctx } = newCanvas(S, S);
  ctx.translate(S / 2, S / 2);
  ctx.rotate(-Math.PI / 2); // белгіні төбесі жоғары қарай «оқ» етіп бұрамыз
  ctx.strokeStyle = "rgba(6,10,12,0.75)";
  ctx.lineWidth = 13;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-12, -15);
  ctx.lineTo(11, 0);
  ctx.lineTo(-12, 15);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-12, -15);
  ctx.lineTo(11, 0);
  ctx.lineTo(-12, 15);
  ctx.stroke();
  return toImg(cv);
}

/** Жұмсақ дөңгелек жарқырау (соғыс/бас қосу нүктелеріне) */
export function makeGlow(color: string): RawImage {
  const S = 96;
  const { cv, ctx } = newCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, hexA(color, 0.95));
  g.addColorStop(0.35, hexA(color, 0.38));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toImg(cv);
}

function hexA(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
