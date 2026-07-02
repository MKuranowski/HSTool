// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later
/// <reference lib="deno.ns" />

import { expect } from "@std/expect";
import { getNthColor } from "./palette.ts";

Deno.test("getNthColor", () => {
    const matrix = [
        [0, "#198754"],
        [10, "#9c5e31"],
        [15, "#e4ab6d"],
        [20, "#0d31f7"],
        [100, "#9df773"],
    ] as const;

    for (const [n, expected] of matrix) {
        expect(getNthColor(n)).toEqual(expected);
    }
});
