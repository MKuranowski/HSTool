// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as random from "./random";

export const primary = "#0d6efd";

export const palette = [
    // Blue (primary) must not be used, as that's the default
    // First two items must match BinaryAnswerButtons
    "#198754",
    "#dc3545",
    // Next colors match Bootstraps palette
    "#ffc107",
    "#0dcaf0",
    "#6f42c1",
    "#fd7e14",
    "#20c997",
    "#d63384",
    // Other different colors
    "#b5b5ac",
    "#c1a470",
    "#9c5e31",
    "#333333",
    "#ec6e65",
    "#b0c124",
];

/**
 * Arbitrary seed for SFC32 to obtain the same pseudo-random numbers
 */
const sfcSeed = { a: 76590865, b: 1843365436, c: 137965250 } as const;

/**
 * Memoization map for getArbitraryColor; to avoid O(n) call complexity;
 * as we expect repeated calls with small, repeating indices.
 */
const getArbitraryColorMemo = new Map<number, string>();

/**
 * Returns an arbitrary color for the given index by instantiating
 * a well-known PRN and running it `index` times.
 */
function getArbitraryColorInner(index: number): string {
    const rng = new random.SFC32({ ...sfcSeed });
    for (let i = 0; i < index; ++i) rng.nextInt();
    return random.color(rng.nextFloat());
}

/**
 * Returns an arbitrary color for the given index, stable across calls.
 */
export function getArbitraryColor(index: number): string {
    const cached = getArbitraryColorMemo.get(index);
    if (cached !== undefined) return cached;

    const color = getArbitraryColorInner(index);
    getArbitraryColorMemo.set(index, color);
    return color;
}

/**
 * Returns a stable, arbitrary color, for a given number; intended for visualizing
 * different options. First couple of colors are returned from {@link palette} (which are roughly
 * different), then arbitrary colors are returned from {@link getArbitraryColor}.
 */
export function getNthColor(index: number) {
    if (Number.isSafeInteger(index) && index >= 0 && index < palette.length) return palette[index];
    return getArbitraryColor(index);
}
