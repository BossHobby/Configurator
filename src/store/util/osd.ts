export class OSD {
  public static CHAR_WIDTH = 12;
  public static CHAR_HEIGHT = 18;
  public static BORDER = 1;

  public static FONT_WIDTH = 16;
  public static FONT_HEIGHT = 16;

  public static FULL_WIDTH = OSD.pixelsWidth(OSD.FONT_WIDTH);
  public static FULL_HEIGHT = OSD.pixelsHeight(OSD.FONT_HEIGHT);

  public static LOGO_HEIGHT = 4;
  public static LOGO_WIDTH = 24;

  public static LOGO_FULL_WIDTH = OSD.pixelsWidth(OSD.LOGO_WIDTH, 0);
  public static LOGO_FULL_HEIGHT = OSD.pixelsHeight(OSD.LOGO_HEIGHT, 0);

  public static pixelsWidth(
    v: number,
    border = OSD.BORDER,
    is_hd = false,
  ): number {
    if (is_hd) {
      border = 0;
    }
    return v * (OSD.CHAR_WIDTH * (is_hd ? 2 : 1) + border) + border;
  }

  public static pixelsHeight(
    v: number,
    border = OSD.BORDER,
    is_hd = false,
  ): number {
    if (is_hd) {
      border = 0;
    }
    return v * (OSD.CHAR_HEIGHT * (is_hd ? 2 : 1) + border) + border;
  }

  public static elementDecode(element, attr) {
    switch (attr) {
      case "active":
        return element & 0x01;
      case "invert":
        return (element >> 1) & 0x01;
      case "pos_x":
        return (element >> 2) & 0xff;
      case "pos_y":
        return (element >> 10) & 0xff;
      default:
        return 0;
    }
  }

  public static elementEncode(element, attr, val) {
    switch (attr) {
      case "active":
        if (val) {
          return element | 0x01;
        } else {
          return element & ~0x01;
        }
      case "invert":
        if (val) {
          return element | (0x01 << 1);
        } else {
          return element & ~(0x01 << 1);
        }
      case "pos_x":
        return (element & ~(0xff << 2)) | ((val & 0xff) << 2);
      case "pos_y":
        return (element & ~(0xff << 10)) | ((val & 0xff) << 10);
      default:
        return element;
    }
  }

  public static unpackFont(canvas: HTMLCanvasElement, font: number[][]) {
    OSD.unpackFontCanvas(canvas, font);
    return canvas.toDataURL();
  }

  public static unpackFontBitmap(font: number[][], inverted = false) {
    const canvas = new global.OffscreenCanvas(209, 305);
    OSD.unpackFontCanvas(canvas, font, inverted);
    return canvas.transferToImageBitmap();
  }

  private static unpackFontCanvas(
    canvas: HTMLCanvasElement,
    font: number[][],
    inverted = false,
  ) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, OSD.FULL_WIDTH, OSD.FULL_HEIGHT);

    const char = new Uint8ClampedArray(OSD.CHAR_WIDTH * OSD.CHAR_HEIGHT * 4);
    for (let cy = 0; cy < OSD.FONT_HEIGHT; cy++) {
      for (let cx = 0; cx < OSD.FONT_WIDTH; cx++) {
        const buf = font[cy * 16 + cx];

        let x = 0;
        let y = 0;
        for (const b of buf) {
          OSD.setPixel(char, x + 0, y, (b >> 6) & 0x3, inverted);
          OSD.setPixel(char, x + 1, y, (b >> 4) & 0x3, inverted);
          OSD.setPixel(char, x + 2, y, (b >> 2) & 0x3, inverted);
          OSD.setPixel(char, x + 3, y, (b >> 0) & 0x3, inverted);

          x += 4;
          if (x == OSD.CHAR_WIDTH) {
            x = 0;
            y++;
          }
        }

        const img = new ImageData(char, OSD.CHAR_WIDTH, OSD.CHAR_HEIGHT);
        ctx.putImageData(img, OSD.pixelsWidth(cx), OSD.pixelsHeight(cy));
      }
    }
  }

  private static packCanvas(ctx: CanvasRenderingContext2D) {
    const img = ctx.getImageData(0, 0, OSD.FULL_WIDTH, OSD.FULL_HEIGHT);
    const font: Uint8Array[] = [];
    for (let cy = 0; cy < OSD.FONT_HEIGHT; cy++) {
      for (let cx = 0; cx < OSD.FONT_WIDTH; cx++) {
        const char = new Uint8Array((OSD.CHAR_WIDTH * OSD.CHAR_HEIGHT) / 4);

        let x = 0;
        let y = 0;
        for (let j = 0; j < 54; j++) {
          char[j] =
            ((OSD.getPixel(
              img.data,
              x + 0 + OSD.pixelsWidth(cx),
              y + OSD.pixelsHeight(cy),
            ) &
              0x3) <<
              6) |
            ((OSD.getPixel(
              img.data,
              x + 1 + OSD.pixelsWidth(cx),
              y + OSD.pixelsHeight(cy),
            ) &
              0x3) <<
              4) |
            ((OSD.getPixel(
              img.data,
              x + 2 + OSD.pixelsWidth(cx),
              y + OSD.pixelsHeight(cy),
            ) &
              0x3) <<
              2) |
            ((OSD.getPixel(
              img.data,
              x + 3 + OSD.pixelsWidth(cx),
              y + OSD.pixelsHeight(cy),
            ) &
              0x3) <<
              0);

          x += 4;
          if (x == OSD.CHAR_WIDTH) {
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

  public static packLogo(
    fontCanvas: HTMLCanvasElement,
    logoCanvas: HTMLCanvasElement,
    logo: CanvasImageSource,
  ) {
    const logoCtx = logoCanvas.getContext("2d")!;
    logoCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
    logoCtx.drawImage(logo, 0, 0);

    const logoChars: Uint8ClampedArray[] = [];
    const img = logoCtx.getImageData(
      0,
      0,
      logo.width as number,
      logo.height as number,
    );
    for (let cy = 0; cy < OSD.LOGO_HEIGHT; cy++) {
      for (let cx = 0; cx < OSD.LOGO_WIDTH; cx++) {
        const char = new Uint8ClampedArray(
          OSD.CHAR_WIDTH * OSD.CHAR_HEIGHT * 4,
        );

        for (let y = 0; y < OSD.CHAR_HEIGHT; y++) {
          for (let x = 0; x < OSD.CHAR_WIDTH; x++) {
            const logoOffset =
              (y + OSD.pixelsHeight(cy, 0)) * OSD.LOGO_FULL_WIDTH +
              x +
              OSD.pixelsWidth(cx, 0);
            char[(y * OSD.CHAR_WIDTH + x) * 4 + 0] =
              img.data[logoOffset * 4 + 0];
            char[(y * OSD.CHAR_WIDTH + x) * 4 + 1] =
              img.data[logoOffset * 4 + 1];
            char[(y * OSD.CHAR_WIDTH + x) * 4 + 2] =
              img.data[logoOffset * 4 + 2];
            char[(y * OSD.CHAR_WIDTH + x) * 4 + 3] =
              img.data[logoOffset * 4 + 3];
          }
        }

        logoChars.push(char);
      }
    }

    const ctx = fontCanvas.getContext("2d")!;
    for (let cy = 10; cy < OSD.FONT_HEIGHT; cy++) {
      for (let cx = 0; cx < OSD.FONT_WIDTH; cx++) {
        const char = logoChars.shift()!;

        const img = new ImageData(char, OSD.CHAR_WIDTH, OSD.CHAR_HEIGHT);
        ctx.putImageData(img, OSD.pixelsWidth(cx), OSD.pixelsHeight(cy));
      }
    }

    return OSD.packCanvas(ctx);
  }

  private static setPixel(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    v: number,
    inverted = false,
  ) {
    let WHITE = 2;
    let BLACK = 0;

    if (inverted) {
      WHITE = 0;
      BLACK = 2;
    }

    switch (v) {
      case BLACK:
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 0] = 0;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 1] = 0;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 2] = 0;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 3] = 255;
        break;
      case WHITE:
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 0] = 255;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 1] = 255;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 2] = 255;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 3] = 255;
        break;
      default:
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 0] = 0;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 1] = 0;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 2] = 0;
        data[(y * OSD.CHAR_WIDTH + x) * 4 + 3] = 0;
        break;
    }
  }

  private static getPixel(
    data: Uint8ClampedArray,
    vx: number,
    vy: number,
  ): number {
    let value = 0;

    const white = data[(vy * OSD.FULL_WIDTH + vx) * 4 + 0];
    if (white > 0) {
      value |= 0x2;
    }

    const alpha = data[(vy * OSD.FULL_WIDTH + vx) * 4 + 3];
    if (alpha < 255) {
      value |= 0x1;
    }

    return value;
  }
}
