// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, test } from "vitest";
import { color, SFC32 } from "./random";

test("SFC32", () => {
    const rng = new SFC32({ a: 314159, b: 271828, c: 141421 });
    expect(rng.nextInt()).toEqual(585988);
    expect(rng.nextInt()).toEqual(1272791);
    expect(rng.nextInt()).toEqual(2062580628);

    expect(rng.nextFloat()).toBeCloseTo(0.448702372843, 12);
    expect(rng.nextFloat()).toBeCloseTo(0.399455308216, 12);
    expect(rng.nextFloat()).toBeCloseTo(0.537051559193, 12);

    // expect(rng.nextFloat()).toBeCloseTo(0.0, 12);
});

test.each([
    [0.41421356237, "#6a09e6"],
    [0.31415926536, "#506cbd"],
    [0.27182818285, "#459688"],
    [0, "#000000"],
])(color, (seed, expectedColor) => {
    expect(color(seed)).toEqual(expectedColor);
});
