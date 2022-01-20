const CHAR_WIDTH = 12;
const CHAR_HEIGHT = 18;
const BORDER = 1;

function pixelsWidth(v: number, border = BORDER): number {
  return v * (CHAR_WIDTH + border) + border;
}

function pixelsHeight(v: number, border = BORDER): number {
  return v * (CHAR_HEIGHT + border) + border;
}

const FONT_WIDTH = 16;
const FONT_HEIGHT = 16;

const FULL_WIDTH = pixelsWidth(FONT_WIDTH);
const FULL_HEIGHT = pixelsHeight(FONT_HEIGHT);

const LOGO_HEIGHT = 4;
const LOGO_WIDTH = 24;

const LOGO_FULL_WIDTH = pixelsWidth(LOGO_WIDTH, 0);
const LOGO_FULL_HEIGHT = pixelsHeight(LOGO_HEIGHT, 0);

export class OSD {

  public static unpackFont(canvas: HTMLCanvasElement, font: number[][]) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, FULL_WIDTH, FULL_HEIGHT);

    const char = new Uint8ClampedArray(CHAR_WIDTH * CHAR_HEIGHT * 4);
    for (let cy = 0; cy < FONT_HEIGHT; cy++) {
      for (let cx = 0; cx < FONT_WIDTH; cx++) {
        const buf = font[cy * 16 + cx];

        let x = 0;
        let y = 0;
        for (const b of buf) {
          OSD.setPixel(char, x + 0, y, (b >> 6) & 0x3);
          OSD.setPixel(char, x + 1, y, (b >> 4) & 0x3);
          OSD.setPixel(char, x + 2, y, (b >> 2) & 0x3);
          OSD.setPixel(char, x + 3, y, (b >> 0) & 0x3);

          x += 4;
          if (x == CHAR_WIDTH) {
            x = 0;
            y++;
          }
        }

        const img = new ImageData(char, CHAR_WIDTH, CHAR_HEIGHT);
        ctx.putImageData(
          img,
          pixelsWidth(cx),
          pixelsHeight(cy)
        );
      }
    }

    return canvas.toDataURL();
  }

  private static packCanvas(ctx: CanvasRenderingContext2D) {
    const img = ctx.getImageData(0, 0, FULL_WIDTH, FULL_HEIGHT);
    const font = [];
    for (let cy = 0; cy < FONT_HEIGHT; cy++) {
      for (let cx = 0; cx < FONT_WIDTH; cx++) {
        const char = new Uint8Array((CHAR_WIDTH * CHAR_HEIGHT) / 4);

        let x = 0;
        let y = 0;
        for (let j = 0; j < 54; j++) {
          char[j] =
            ((OSD.getPixel(img.data, x + 0 + pixelsWidth(cx), y + pixelsHeight(cy)) & 0x3) << 6) |
            ((OSD.getPixel(img.data, x + 1 + pixelsWidth(cx), y + pixelsHeight(cy)) & 0x3) << 4) |
            ((OSD.getPixel(img.data, x + 2 + pixelsWidth(cx), y + pixelsHeight(cy)) & 0x3) << 2) |
            ((OSD.getPixel(img.data, x + 3 + pixelsWidth(cx), y + pixelsHeight(cy)) & 0x3) << 0);

          x += 4;
          if (x == CHAR_WIDTH) {
            x = 0;
            y++;
          }
        }

        font.push(char);
      }
    }

    return font;
  }

  public static packFont(canvas: HTMLCanvasElement, src: CanvasImageSource) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0);

    return OSD.packCanvas(ctx);
  }

  public static packLogo(fontCanvas: HTMLCanvasElement, logoCanvas: HTMLCanvasElement, logo: CanvasImageSource) {
    const logoCtx = logoCanvas.getContext("2d")!;
    logoCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
    logoCtx.drawImage(logo, 0, 0);

    const logoChars = [];
    const img = logoCtx.getImageData(0, 0, logo.width as number, logo.height as number);
    for (let cy = 0; cy < LOGO_HEIGHT; cy++) {
      for (let cx = 0; cx < LOGO_WIDTH; cx++) {
        const char = new Uint8ClampedArray(CHAR_WIDTH * CHAR_HEIGHT * 4);

        for (let y = 0; y < CHAR_HEIGHT; y++) {
          for (let x = 0; x < CHAR_WIDTH; x++) {
            const logoOffset = (y + pixelsHeight(cy, 0)) * LOGO_FULL_WIDTH + x + pixelsWidth(cx, 0)
            char[(y * CHAR_WIDTH + x) * 4 + 0] = img.data[logoOffset * 4 + 0];
            char[(y * CHAR_WIDTH + x) * 4 + 1] = img.data[logoOffset * 4 + 1];
            char[(y * CHAR_WIDTH + x) * 4 + 2] = img.data[logoOffset * 4 + 2];
            char[(y * CHAR_WIDTH + x) * 4 + 3] = img.data[logoOffset * 4 + 3];
          }
        }

        logoChars.push(char);
      }
    }

    const ctx = fontCanvas.getContext("2d")!;
    for (let cy = 10; cy < FONT_HEIGHT; cy++) {
      for (let cx = 0; cx < FONT_WIDTH; cx++) {
        const char = logoChars.shift()!;

        const img = new ImageData(char, CHAR_WIDTH, CHAR_HEIGHT);
        ctx.putImageData(
          img,
          pixelsWidth(cx),
          pixelsHeight(cy)
        );
      }
    }

    return OSD.packCanvas(ctx);
  }

  private static setPixel(data: Uint8ClampedArray, x: number, y: number, v: number) {
    switch (v) {
      case 0:
        data[(y * CHAR_WIDTH + x) * 4 + 0] = 0;
        data[(y * CHAR_WIDTH + x) * 4 + 1] = 0;
        data[(y * CHAR_WIDTH + x) * 4 + 2] = 0;
        data[(y * CHAR_WIDTH + x) * 4 + 3] = 255;
        break;
      case 2:
        data[(y * CHAR_WIDTH + x) * 4 + 0] = 255;
        data[(y * CHAR_WIDTH + x) * 4 + 1] = 255;
        data[(y * CHAR_WIDTH + x) * 4 + 2] = 255;
        data[(y * CHAR_WIDTH + x) * 4 + 3] = 255;
        break;
      default:
        data[(y * CHAR_WIDTH + x) * 4 + 0] = 0;
        data[(y * CHAR_WIDTH + x) * 4 + 1] = 0;
        data[(y * CHAR_WIDTH + x) * 4 + 2] = 0;
        data[(y * CHAR_WIDTH + x) * 4 + 3] = 0;
        break;
    }
  }

  private static getPixel(data: Uint8ClampedArray, vx: number, vy: number): number {
    let value = 0;

    const white = data[(vy * FULL_WIDTH + vx) * 4 + 0];
    if (white > 0) {
      value |= 0x2;
    }

    const alpha = data[(vy * FULL_WIDTH + vx) * 4 + 3];
    if (alpha < 255) {
      value |= 0x1;
    }

    return value;
  }


}