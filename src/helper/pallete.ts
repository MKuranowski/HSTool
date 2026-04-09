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

/// Arbitrary seed for SFC32 to obtain the same numbers
const sfcSeed = { a: 76590865, b: 1843365436, c: 137965250 } as const;

/// Returns an arbitrary color for the given index, stable across calls
function getArbitraryColor(index: number): string {
    const rng = new random.SFC32({ ...sfcSeed, counter: index });
    return random.color(rng.nextFloat());
}

export function getNthColor(index: number) {
    if (Number.isSafeInteger(index) && index >= 0 && index < palette.length) return palette[index];
    return getArbitraryColor(index);
}
