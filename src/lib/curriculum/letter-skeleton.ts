import { isUppercaseRun, splitByCase } from "./writing";

/**
 * Dots that follow the centre line of a letter.
 *
 * The obvious approaches both fail. Stroking a glyph with `stroke-dasharray`
 * traces its *outline*, so every stem gets two parallel dotted edges. Filling
 * a glyph with a dot pattern puts dots on a fixed grid that ignores where the
 * strokes actually are.
 *
 * What is wanted is the same letter with its stroke turned dotted — which
 * means dots along the stroke's centre line. That centre line is not something
 * a font exposes, so it is recovered from the glyph itself:
 *
 *   1. draw the letter to an offscreen canvas
 *   2. thin the shape to a one-pixel skeleton (Zhang-Suen)
 *   3. sample the skeleton at even spacing to get dot positions
 *
 * Results are returned in em units relative to the glyph's centre and
 * baseline, so they can be scaled to any size, and are cached per letter.
 */

export interface SkeletonDot {
  /** Offset from the glyph's horizontal centre, in em. */
  x: number;
  /** Offset from the baseline, in em. Negative is above. */
  y: number;
}

export interface SkeletonRequest {
  glyph: string;
  fontFamily: string;
  fontWeight: number;
  /** Capitals are drawn larger so they reach the top line — see rulingGeometry. */
  capitalScale: number;
  /** Distance between dots, in em. */
  spacing: number;
}

/** Pixels per em used for the offscreen raster. Higher is smoother, slower. */
const RASTER = 200;

/**
 * Branches shorter than this (in pixels) are thinning artefacts — little barbs
 * at stroke ends and staircase stubs — rather than real strokes.
 */
const SPUR_LIMIT = 8;

/** Smoothing passes applied to each traced path before measuring its length. */
const SMOOTHING_PASSES = 2;

/**
 * An ink blob this small in *both* directions is a mark rather than a stroke —
 * the tittle over an 'i' or a 'j'. Measured in em.
 *
 * Andika's tittle measures 0.165em square; the slimmest thing that must not be
 * caught is the stem of an 'i', which is 0.15em wide but 0.495em tall. Testing
 * both dimensions keeps them well apart.
 */
const DOT_MARK_SIZE = 0.2;

/**
 * Letters whose lowest dot is dropped.
 *
 * Where a stroke ends, its medial axis bends into the flare of the terminal,
 * which leaves the final dot sitting off the line of its own stroke — clearly
 * visible at the foot of an 'i' or an 'F'. There is no reliable way to tell
 * that apart from a terminal worth keeping: the feet of an 'A' deviate *more*
 * (41° against 36° for 'F'), yet those dots should stay. So the letters whose
 * last dot is unwanted are listed here rather than inferred.
 *
 * Font-specific: re-check this list if the letter font changes.
 */
const DROP_LOWEST_DOT = new Set(["i", "F"]);

/**
 * Letters that drop the lowest dot on *each* side of their centre.
 *
 * An 'A' needs one gone from the foot of each leg, where the medial axis bends
 * outwards into the terminal and leaves a dot wide of the line the child is
 * meant to draw. Applied per letter rather than per glyph — see withoutFeet —
 * so a paired "Aa" loses the feet of its 'A' and nothing off the 'a'.
 */
const DROP_LOWEST_EACH_SIDE = new Set(["A"]);

/**
 * How far the right leg of a capital A is pulled back off its flare, in em.
 *
 * Where that leg meets the baseline the medial axis bends outwards into the
 * terminal, leaving the last dot sitting wide of the line the child is meant
 * to draw down. Small — a fifth of the gap between dots — so the leg reads as
 * straight rather than as bending the other way.
 */
const A_FOOT_NUDGE = 0.02;

/** A turn sharper than this counts as a corner and always gets its own dot. */
const CORNER_ANGLE = (50 * Math.PI) / 180;

/** How far along the path to look when measuring a turn, in pixels. */
const CORNER_WINDOW = 6;

type Point = [x: number, y: number];

interface SkeletonPath {
  points: Point[];
  closed: boolean;
}

const NEIGHBOUR_OFFSETS: Point[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/**
 * How many separate strokes meet at this pixel.
 *
 * Counting raw neighbours is wrong: on a diagonal run the skeleton
 * staircases, so an ordinary pixel can touch three or four others and look
 * like a junction. Counting *connected groups* of neighbours instead (the
 * crossing number) reports 2 for any pixel in the middle of a stroke, 1 at a
 * stroke end, and 3+ only where strokes genuinely meet.
 *
 * Measured on Andika: by raw degree the letter 'c' appears to have 40
 * junctions; by crossing number it correctly has none.
 */
function branchesAt(
  bits: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const at = (dx: number, dy: number) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) return 0;
    return bits[ny * width + nx];
  };

  // Clockwise from north.
  const ring = [
    at(0, -1),
    at(1, -1),
    at(1, 0),
    at(1, 1),
    at(0, 1),
    at(-1, 1),
    at(-1, 0),
    at(-1, -1),
  ];

  let groups = 0;
  for (let i = 0; i < 8; i += 1) {
    if (ring[i] === 0 && ring[(i + 1) % 8] === 1) groups += 1;
  }
  return groups;
}

function neighboursOf(
  bits: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): Point[] {
  const found: Point[] = [];
  for (const [dx, dy] of NEIGHBOUR_OFFSETS) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (bits[ny * width + nx]) found.push([nx, ny]);
  }
  return found;
}

/**
 * Removes short branches that hang off a junction.
 *
 * Thinning leaves small barbs where strokes meet and where a diagonal run
 * staircases. Left alone they split what should be one smooth path into
 * fragments, which makes dot spacing lumpy.
 */
function pruneSpurs(bits: Uint8Array, width: number, height: number) {
  let changed = true;

  while (changed) {
    changed = false;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        if (!bits[y * width + x]) continue;
        if (branchesAt(bits, width, height, x, y) !== 1) continue;

        const chain: Point[] = [[x, y]];
        let previous: Point = [x, y];
        let [cx, cy] = neighboursOf(bits, width, height, x, y)[0];

        while (chain.length <= SPUR_LIMIT) {
          const degree = branchesAt(bits, width, height, cx, cy);

          if (degree > 2) {
            // Reached a junction: the whole chain was a spur.
            for (const [px, py] of chain) bits[py * width + px] = 0;
            changed = true;
            break;
          }
          if (degree < 2) break; // an isolated stroke, not a spur

          chain.push([cx, cy]);
          const onward = neighboursOf(bits, width, height, cx, cy).filter(
            ([nx, ny]) => !(nx === previous[0] && ny === previous[1]),
          );
          if (onward.length === 0) break;
          previous = [cx, cy];
          [cx, cy] = onward[0];
        }
      }
    }
  }
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/**
 * Walks the skeleton into ordered paths.
 *
 * Open paths run between endpoints and junctions; anything left over with no
 * endpoint at all is a closed loop, such as the bowl of an 'o'.
 */
function tracePaths(
  bits: Uint8Array,
  width: number,
  height: number,
): SkeletonPath[] {
  const visited = new Uint8Array(width * height);
  const usedEdges = new Set<string>();
  const paths: SkeletonPath[] = [];

  const branches = (x: number, y: number) =>
    branchesAt(bits, width, height, x, y);

  const walk = (start: Point, first: Point): Point[] => {
    const points: Point[] = [start];
    let [px, py] = start;
    let [cx, cy] = first;

    for (;;) {
      points.push([cx, cy]);
      // Junctions stay unvisited so their other branches can still be walked.
      if (branches(cx, cy) === 2) visited[cy * width + cx] = 1;
      else break;

      const onward = neighboursOf(bits, width, height, cx, cy).filter(
        ([nx, ny]) => !visited[ny * width + nx] && !(nx === px && ny === py),
      );
      if (onward.length === 0) break;

      // Where a staircase offers a sideways pixel as well as the forward one,
      // take the step furthest from where we came — that follows the stroke
      // instead of wandering into its own shoulder.
      let best = onward[0];
      let bestDistance = -1;
      for (const [nx, ny] of onward) {
        const distance = (nx - px) ** 2 + (ny - py) ** 2;
        if (distance > bestDistance) {
          bestDistance = distance;
          best = [nx, ny];
        }
      }

      px = cx;
      py = cy;
      [cx, cy] = best;
    }

    return points;
  };

  // Strokes that begin at an endpoint or a junction.
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if (!bits[y * width + x]) continue;
      if (branches(x, y) === 2) continue;

      const outgoing = neighboursOf(bits, width, height, x, y);
      if (outgoing.length === 0) {
        // A stranded pixel — no walk can start from it, but it is still part
        // of the letter and deserves its dot.
        visited[y * width + x] = 1;
        paths.push({ points: [[x, y]], closed: false });
        continue;
      }

      for (const [nx, ny] of outgoing) {
        if (visited[ny * width + nx]) continue;
        const key = edgeKey(y * width + x, ny * width + nx);
        if (usedEdges.has(key)) continue;
        usedEdges.add(key);

        const points = walk([x, y], [nx, ny]);
        if (points.length > 1) paths.push({ points, closed: false });
      }
    }
  }

  // Anything still untouched has no endpoint at all — a closed loop, such as
  // the bowl of an 'o'.
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if (!bits[y * width + x]) continue;
      if (visited[y * width + x]) continue;
      if (branches(x, y) !== 2) continue;

      const neighbours = neighboursOf(bits, width, height, x, y);
      if (neighbours.length === 0) continue;

      visited[y * width + x] = 1;
      const points = walk([x, y], neighbours[0]);
      if (points.length > 2) {
        // The walk comes back to where it started; drop the repeat so the
        // loop is not sampled twice in the same place.
        const last = points[points.length - 1];
        if (last[0] === x && last[1] === y) points.pop();
        paths.push({ points, closed: true });
      }
    }
  }

  return paths;
}

/** Light [1 2 1] smoothing — takes the staircase off a rasterised path. */
function smooth(path: SkeletonPath): Point[] {
  let points = path.points;
  if (points.length < 3) return points;

  for (let pass = 0; pass < SMOOTHING_PASSES; pass += 1) {
    const next: Point[] = points.map((point, index) => {
      if (!path.closed && (index === 0 || index === points.length - 1)) {
        return point; // pin the ends of an open stroke
      }
      const previous = points[(index - 1 + points.length) % points.length];
      const following = points[(index + 1) % points.length];
      return [
        (previous[0] + 2 * point[0] + following[0]) / 4,
        (previous[1] + 2 * point[1] + following[1]) / 4,
      ];
    });
    points = next;
  }

  return points;
}

/**
 * Indexes where the path turns sharply.
 *
 * Sampling purely by arc length can step straight over a corner — the apex of
 * an 'A' is the clearest case — leaving the tip of the letter with no dot.
 * Splitting at corners guarantees one lands exactly on the turn, which is also
 * where a child's pen changes direction.
 */
function cornerIndexes(points: Point[], closed: boolean): number[] {
  const count = points.length;
  if (count < CORNER_WINDOW * 2 + 1) return [];

  const found: Array<{ index: number; angle: number }> = [];
  const first = closed ? 0 : CORNER_WINDOW;
  const last = closed ? count : count - CORNER_WINDOW;

  for (let i = first; i < last; i += 1) {
    const before = points[(i - CORNER_WINDOW + count) % count];
    const here = points[i];
    const after = points[(i + CORNER_WINDOW) % count];

    const inX = here[0] - before[0];
    const inY = here[1] - before[1];
    const outX = after[0] - here[0];
    const outY = after[1] - here[1];

    const turn = Math.abs(
      Math.atan2(inX * outY - inY * outX, inX * outX + inY * outY),
    );
    if (turn > CORNER_ANGLE) found.push({ index: i, angle: turn });
  }

  // Neighbouring hits describe the same corner; keep the sharpest of each run.
  const corners: number[] = [];
  let run: Array<{ index: number; angle: number }> = [];

  const flush = () => {
    if (run.length === 0) return;
    const sharpest = run.reduce((best, item) =>
      item.angle > best.angle ? item : best,
    );
    corners.push(sharpest.index);
    run = [];
  };

  for (const hit of found) {
    if (run.length > 0 && hit.index - run[run.length - 1].index > CORNER_WINDOW) {
      flush();
    }
    run.push(hit);
  }
  flush();

  return corners;
}

/** Breaks a path into segments that each run from one corner to the next. */
function splitAtCorners(points: Point[], closed: boolean): Point[][] {
  const corners = cornerIndexes(points, closed);
  if (corners.length === 0) return [closed ? [...points, points[0]] : points];

  // A closed path is reopened at its first corner so it can be cut like any
  // other run of points.
  const opened = closed
    ? [...points.slice(corners[0]), ...points.slice(0, corners[0]), points[corners[0]]]
    : points;
  const cuts = closed
    ? corners.slice(1).map((index) => index - corners[0])
    : corners;

  const segments: Point[][] = [];
  let start = 0;
  for (const cut of cuts) {
    if (cut - start >= 1) segments.push(opened.slice(start, cut + 1));
    start = cut;
  }
  if (opened.length - start >= 2) segments.push(opened.slice(start));

  return segments.length > 0 ? segments : [opened];
}

/**
 * Places points at even arc-length intervals along a path.
 *
 * Measuring along the path rather than straight-line between dots is what
 * keeps the spacing even round a curve. Open strokes get a dot at each end so
 * they do not appear to stop short.
 */
function sampleAlongPath(
  points: Point[],
  closed: boolean,
  spacing: number,
): Point[] {
  const walkPoints = closed ? [...points, points[0]] : points;

  const cumulative: number[] = [0];
  for (let i = 1; i < walkPoints.length; i += 1) {
    const dx = walkPoints[i][0] - walkPoints[i - 1][0];
    const dy = walkPoints[i][1] - walkPoints[i - 1][1];
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }

  const length = cumulative[cumulative.length - 1];
  if (length === 0) return [walkPoints[0]];

  // Ceil, not round: rounding down stretches a segment of, say, 1.4 spacings
  // into a single 1.4-spacing gap. Rounding up can only tighten the spacing,
  // so no gap ever exceeds the target.
  const intervals = Math.max(closed ? 3 : 1, Math.ceil(length / spacing));
  // A closed loop's last sample would land on its first, so stop one short.
  const sampleCount = closed ? intervals : intervals + 1;

  const samples: Point[] = [];
  let segment = 1;

  for (let i = 0; i < sampleCount; i += 1) {
    const target = (i * length) / intervals;
    while (segment < cumulative.length - 1 && cumulative[segment] < target) {
      segment += 1;
    }
    const spanStart = cumulative[segment - 1];
    const spanLength = cumulative[segment] - spanStart;
    const t = spanLength === 0 ? 0 : (target - spanStart) / spanLength;
    const a = walkPoints[segment - 1];
    const b = walkPoints[segment];
    samples.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }

  return samples;
}

function skeletonKey(request: SkeletonRequest) {
  return [
    request.glyph,
    request.fontFamily,
    request.fontWeight,
    request.capitalScale.toFixed(3),
    request.spacing.toFixed(3),
  ].join("|");
}

/**
 * Pulls small round blobs out of the shape before thinning, returning their
 * centres.
 *
 * The tittle over an 'i' is small enough that Zhang-Suen erodes it away
 * completely, and the one over a 'j' survives only as a single stranded pixel
 * that no path can start from — either way the letter would print undotted.
 * Taking these marks out first and placing one dot at the centre of each is
 * both more robust and more faithful: a tittle *is* a single dot.
 */
function extractDotMarks(
  bits: Uint8Array,
  width: number,
  height: number,
  maxSize: number,
): Point[] {
  const seen = new Uint8Array(width * height);
  const marks: Point[] = [];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const start = y * width + x;
      if (!bits[start] || seen[start]) continue;

      // Flood the connected blob.
      const stack: Point[] = [[x, y]];
      const pixels: Point[] = [];
      seen[start] = 1;

      while (stack.length > 0) {
        const [cx, cy] = stack.pop() as Point;
        pixels.push([cx, cy]);

        for (const [dx, dy] of NEIGHBOUR_OFFSETS) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 1 || ny < 1 || nx >= width - 1 || ny >= height - 1) continue;
          const index = ny * width + nx;
          if (bits[index] && !seen[index]) {
            seen[index] = 1;
            stack.push([nx, ny]);
          }
        }
      }

      const xs = pixels.map(([px]) => px);
      const ys = pixels.map(([, py]) => py);
      const spanX = Math.max(...xs) - Math.min(...xs);
      const spanY = Math.max(...ys) - Math.min(...ys);
      if (spanX > maxSize || spanY > maxSize) continue;

      marks.push([
        pixels.reduce((sum, [px]) => sum + px, 0) / pixels.length,
        pixels.reduce((sum, [, py]) => sum + py, 0) / pixels.length,
      ]);
      for (const [px, py] of pixels) bits[py * width + px] = 0;
    }
  }

  return marks;
}

/**
 * Zhang-Suen thinning: repeatedly strips boundary pixels that are not needed
 * to keep the shape connected, until only a one-pixel-wide skeleton remains.
 */
function thin(bits: Uint8Array, width: number, height: number) {
  const at = (x: number, y: number) => bits[y * width + x];

  let changed = true;
  while (changed) {
    changed = false;

    for (const step of [0, 1] as const) {
      const doomed: number[] = [];

      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          if (!at(x, y)) continue;

          // Eight neighbours, clockwise from north.
          const p2 = at(x, y - 1);
          const p3 = at(x + 1, y - 1);
          const p4 = at(x + 1, y);
          const p5 = at(x + 1, y + 1);
          const p6 = at(x, y + 1);
          const p7 = at(x - 1, y + 1);
          const p8 = at(x - 1, y);
          const p9 = at(x - 1, y - 1);

          const filled = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (filled < 2 || filled > 6) continue;

          // Number of 0 -> 1 transitions going round the neighbourhood. Exactly
          // one means removing this pixel cannot break the shape apart.
          const ring = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let transitions = 0;
          for (let i = 0; i < 8; i += 1) {
            if (ring[i] === 0 && ring[i + 1] === 1) transitions += 1;
          }
          if (transitions !== 1) continue;

          if (step === 0) {
            if (p2 && p4 && p6) continue;
            if (p4 && p6 && p8) continue;
          } else {
            if (p2 && p4 && p8) continue;
            if (p2 && p6 && p8) continue;
          }

          doomed.push(y * width + x);
        }
      }

      if (doomed.length > 0) {
        changed = true;
        for (const index of doomed) bits[index] = 0;
      }
    }
  }
}

/**
 * Draws the glyph exactly as the worksheet renders it — capitals scaled up,
 * the whole string centred on the baseline.
 */
function drawGlyph(
  ctx: CanvasRenderingContext2D,
  request: SkeletonRequest,
  centreX: number,
  baselineY: number,
): GlyphRun[] {
  const runs = splitByCase(request.glyph).map((text) => ({
    text,
    size: isUppercaseRun(text) ? RASTER * request.capitalScale : RASTER,
    width: 0,
  }));

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";

  let total = 0;
  for (const run of runs) {
    ctx.font = `${request.fontWeight} ${run.size}px ${request.fontFamily}`;
    run.width = ctx.measureText(run.text).width;
    total += run.width;
  }

  const drawn: GlyphRun[] = [];
  let x = centreX - total / 2;
  for (const run of runs) {
    ctx.font = `${request.fontWeight} ${run.size}px ${request.fontFamily}`;
    ctx.fillText(run.text, x, baselineY);
    drawn.push({ text: run.text, from: x, to: x + run.width });
    x += run.width;
  }

  return drawn;
}

/**
 * Where each letter of the glyph was drawn.
 *
 * A paired "Aa" is two letters on one canvas, and a rule written for one of
 * them has to be able to say which dots are its own.
 */
interface GlyphRun {
  text: string;
  from: number;
  to: number;
}

/**
 * Drops the lowest dot on each side of one letter's centre.
 *
 * Where a stroke ends, its medial axis bends into the flare of the terminal,
 * so the feet of an 'A' finish wide of the lines a child is meant to draw.
 * Taking the two lowest overall would not do it: the feet sit at different
 * heights, and the left leg has a second dot level with the right foot, so a
 * tie could strip two dots from one leg and none from the other.
 */
function withoutFeet(points: Point[], run: GlyphRun): Point[] {
  const centre = (run.from + run.to) / 2;
  const mine = points.filter(([x]) => x >= run.from && x < run.to);

  const lowestOf = (side: Point[]) =>
    side.reduce<Point | null>(
      (lowest, point) => (!lowest || point[1] > lowest[1] ? point : lowest),
      null,
    );

  const feet = new Set(
    [
      lowestOf(mine.filter(([x]) => x < centre)),
      lowestOf(mine.filter(([x]) => x >= centre)),
    ].filter((point): point is Point => point !== null),
  );

  return points.filter((point) => !feet.has(point));
}

function computeDots(request: SkeletonRequest): SkeletonDot[] {
  const width = RASTER * 3;
  const height = RASTER * 2;
  const centreX = width / 2;
  const baselineY = RASTER * 1.3;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const runs = drawGlyph(ctx, request, centreX, baselineY);

  const pixels = ctx.getImageData(0, 0, width, height).data;
  const bits = new Uint8Array(width * height);
  for (let i = 0; i < bits.length; i += 1) {
    bits[i] = pixels[i * 4 + 3] > 128 ? 1 : 0;
  }

  // Tittles come out before thinning, which would otherwise erase them.
  const marks = extractDotMarks(bits, width, height, DOT_MARK_SIZE * RASTER);

  thin(bits, width, height);
  pruneSpurs(bits, width, height);

  const spacing = request.spacing * RASTER;

  // Sample each stroke along its own length, longest first so the best-spaced
  // runs claim their positions before shorter fragments do.
  const paths = tracePaths(bits, width, height)
    .map((path) => ({ ...path, points: smooth(path) }))
    .sort((a, b) => b.points.length - a.points.length);

  // Dots from different strokes can coincide at a junction or a corner; drop
  // the repeats. Marks go in first so a tittle can never be the one dropped.
  const mergeDistanceSquared = (spacing * 0.55) ** 2;
  const kept: Point[] = [...marks];

  for (const path of paths) {
    for (const segment of splitAtCorners(path.points, path.closed)) {
      for (const sample of sampleAlongPath(segment, false, spacing)) {
        let duplicate = false;
        for (const existing of kept) {
          const dx = sample[0] - existing[0];
          const dy = sample[1] - existing[1];
          if (dx * dx + dy * dy < mergeDistanceSquared) {
            duplicate = true;
            break;
          }
        }
        if (!duplicate) kept.push(sample);
      }
    }
  }

  // One dot per listed letter in the glyph, taken from the bottom up, so
  // "Ii" loses the foot of each stem rather than just one of them.
  const dropCount = [...request.glyph].filter((letter) =>
    DROP_LOWEST_DOT.has(letter),
  ).length;

  let ordered =
    dropCount > 0
      ? [...kept].sort((a, b) => b[1] - a[1]).slice(dropCount)
      : kept;

  // Single-letter glyphs only. Doing this per run would be the way to reach
  // the 'A' inside a paired "Aa", but a run's territory is its advance width,
  // and that letter's flared right foot sits outside its own advance — so the
  // rule finds one foot and not the other. Until a letter's dots can be told
  // apart from its neighbour's reliably, a pair is left alone.
  for (const run of runs) {
    if (runs.length === 1 && DROP_LOWEST_EACH_SIDE.has(run.text)) {
      ordered = withoutFeet(ordered, run);
    }
  }

  /*
   * Finishing the right leg of a capital A.
   *
   * Dropping a foot from each side above leaves that leg a dot shorter than
   * the left — the two feet sit at different heights, so the same rule takes
   * different amounts off each — and the dot it now ends on is the one bent
   * outwards by the terminal. So it is pulled back onto the line of its own
   * stroke, and one more is carried on below it at the leg's own spacing,
   * which brings the two legs down to the same depth.
   *
   * Single-letter glyphs only: in a paired "Aa" the right-hand side of the
   * glyph is the 'a', which has no leg to finish.
   */
  if (request.glyph === "A") {
    const rightSide = ordered.filter(([x]) => x >= centreX);
    const foot = rightSide.reduce<Point | null>(
      (lowest, point) => (!lowest || point[1] > lowest[1] ? point : lowest),
      null,
    );

    // The dot above it *along the leg*, found by nearness rather than by
    // height: the right-hand end of the crossbar is higher than the foot but
    // nothing to do with the leg, and measuring the step to that would send
    // the new dot off sideways.
    const above =
      foot &&
      rightSide
        .filter((point) => point !== foot)
        .reduce<Point | null>((nearest, point) => {
          const gap = Math.hypot(point[0] - foot[0], point[1] - foot[1]);
          if (!nearest) return point;
          return gap < Math.hypot(nearest[0] - foot[0], nearest[1] - foot[1])
            ? point
            : nearest;
        }, null);

    if (foot && above) {
      // Measured before the nudge, so the added dot carries on down the leg
      // rather than along the correction.
      const step: Point = [foot[0] - above[0], foot[1] - above[1]];
      const pulledIn: Point = [foot[0] - A_FOOT_NUDGE * RASTER, foot[1]];

      ordered = ordered
        .map((point) => (point === foot ? pulledIn : point))
        .concat([[pulledIn[0] + step[0], pulledIn[1] + step[1]]]);
    }
  }

  return ordered.map(([x, y]) => ({
    x: (x - centreX) / RASTER,
    y: (y - baselineY) / RASTER,
  }));
}

const cache = new Map<string, SkeletonDot[]>();
const inFlight = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function getCachedDots(request: SkeletonRequest): SkeletonDot[] | null {
  return cache.get(skeletonKey(request)) ?? null;
}

export function subscribeToDots(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * Computes the dots for a letter if they are not cached yet.
 *
 * Deferred until web fonts have loaded — rasterising against a fallback font
 * would produce a skeleton for the wrong letterform.
 */
export function requestDots(request: SkeletonRequest) {
  const key = skeletonKey(request);
  if (cache.has(key) || inFlight.has(key)) return;

  inFlight.add(key);
  void document.fonts.ready.then(() => {
    try {
      cache.set(key, computeDots(request));
    } catch {
      // Canvas unavailable or blocked — the row simply renders no dots.
      cache.set(key, []);
    } finally {
      inFlight.delete(key);
      notify();
    }
  });
}
