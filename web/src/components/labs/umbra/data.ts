// A fictional studio that builds composite images, so everything on the page
// is measured the way a compositor measures: heights in decimetres, the sun in
// degrees above the horizon, and the side it comes from.
//
// The scene is drawn in decimetres because the SVG's viewBox is the scene. A
// column 6.2 m tall is 62 units, and its shadow is whatever the trigonometry
// says it is at the angle the light is set to. Nothing is scaled by hand.

/** Which side the light comes from. Shadows fall the other way. */
export type Side = "left" | "right";

export type Shape = "sphere" | "column" | "door" | "chair" | "lamp" | "plant";

export interface Piece {
  id: string;
  name: string;
  shape: Shape;
  /** decimetres from the left edge of the scene */
  x: number;
  /** decimetres tall */
  height: number;
  /** decimetres wide on the ground */
  width: number;
  /**
   * Decimetres from the ground to the centre, for the one thing in the scene
   * that does not touch it. A floating sphere throws its shadow away from
   * itself, which is the whole reason it is in the picture.
   */
  lift?: number;
  /**
   * How far back the object stands, as a row rather than a distance. Objects
   * in the same row would have their shadows lying on top of each other, and a
   * picture where three shadows read as one flat sheet says nothing. Nothing
   * is scaled by row: the sizes stay true to each other and only the ground
   * line moves, which is a liberty this kind of picture is entitled to.
   */
  lane: number;
}

/** What the studio built itself, all lit by the scene's own sun. */
export const SCENE: Piece[] = [
  {
    id: "sphere",
    name: "ทรงกลมลอย",
    shape: "sphere",
    x: 30,
    height: 22,
    width: 22,
    lift: 24,
    lane: 0,
  },
  {
    id: "column",
    name: "เสาหิน",
    shape: "column",
    x: 62,
    height: 32,
    width: 7,
    lane: 1,
  },
  {
    id: "door",
    name: "ประตูกลางที่ราบ",
    shape: "door",
    x: 92,
    height: 21,
    width: 11,
    lane: 2,
  },
];

/**
 * A real object cut out of a different photograph, which is how a composite is
 * actually made. Each one brought the light it was shot under with it.
 */
export interface Borrowed extends Piece {
  /** degrees above the horizon in the photograph it came from */
  elevation: number;
  /** the side that photograph was lit from */
  side: Side;
  source: string;
}

export const BORROWED: Borrowed[] = [
  {
    id: "chair",
    name: "เก้าอี้ไม้",
    shape: "chair",
    x: 118,
    height: 9,
    width: 10,
    lane: 3,
    elevation: 71,
    side: "right",
    source: "ถ่ายกลางแดดเที่ยง หน้าบ้านช่างภาพ",
  },
  {
    id: "lamp",
    name: "โคมไฟตั้งพื้น",
    shape: "lamp",
    x: 118,
    height: 16,
    width: 7,
    lane: 3,
    elevation: 38,
    side: "left",
    source: "ถ่ายในสตูดิโอ ไฟดวงเดียวตั้งสูง",
  },
  {
    id: "plant",
    name: "กระถางต้นไม้",
    shape: "plant",
    x: 118,
    height: 13,
    width: 9,
    lane: 3,
    elevation: 11,
    side: "right",
    source: "ถ่ายตอนห้าโมงเย็น ริมระเบียง",
  },
];

/** Where the ground starts, in the scene's own decimetres. */
export const SCENE_BOX = { width: 150, height: 112, ground: 70 };

/** Decimetres the ground line drops per row, which is all the depth there is. */
export const LANE_DROP = 6;

/** Angles that mean something to anyone who has stood outside in Bangkok. */
export const HOURS = [
  { id: "morning", label: "เจ็ดโมงเช้า", elevation: 18 },
  { id: "noon", label: "เที่ยงตรง", elevation: 68 },
  { id: "evening", label: "ห้าโมงเย็น", elevation: 17 },
];

/**
 * Below 16 degrees the sphere's ellipse is thrown so far to the side that most
 * of it is outside the frame, which is what really happens to a shadow at that
 * hour but leaves the picture with nothing to read. The bands of the two
 * standing pieces run off the edge well before that, and are meant to.
 */
export const ELEVATION_LIMITS = { min: 16, max: 74 };

/**
 * What the studio charges to put a borrowed object into a scene. Relighting in
 * software is cheap while the shadow only has to be stretched; once the lit
 * side is on the wrong side of the object there is nothing to stretch, and the
 * honest answer is a reshoot.
 */
export const RATES = {
  stretch: 1200,
  redraw: 2400,
  reshoot: 3500,
};

export const STUDIO = {
  name: "อุมบรา",
  latin: "UMBRA",
  line: "ภาพประกอบโฆษณาและงานคอมโพสิต",
  keeper: "ฟิล์ม",
};

/** Decimetres, written the way the studio writes them. */
export const metres = (decimetres: number) => (decimetres / 10).toFixed(2);

export const baht = (value: number) => value.toLocaleString("th-TH");
