// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, test } from "vitest";
import { getNthColor } from "./palette";

test.each([
    [0, "#198754"],
    [10, "#9c5e31"],
    [15, "#e4ab6d"],
    [20, "#0d31f7"],
    [100, "#9df773"],
])(getNthColor, (index, expectedColor) => {
    // Two calls to test stability of `getArbitraryColor`
    expect(getNthColor(index)).toEqual(expectedColor);
    expect(getNthColor(index)).toEqual(expectedColor);
});
