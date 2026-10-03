/**
 * App artwork, served from this app's own /public folder.
 *
 * These used to load from a Manus-hosted CDN that stopped serving them,
 * leaving a broken-image placeholder where Hilal should be. Keeping the
 * files in-repo means they deploy with the app and can't disappear.
 */
const base = import.meta.env.BASE_URL;

export const MASCOT = `${base}images/hilal.svg`;
export const PATTERN_TILE = `${base}images/pattern-tile.svg`;
