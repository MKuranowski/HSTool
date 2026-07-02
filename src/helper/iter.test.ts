// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, test } from "vitest";
import * as iter from "./iter.ts";

test("map", () => {
    expect([...iter.map([1, 2, 3], (num) => num + 5)]).toEqual([6, 7, 8]);
});

test("filter", () => {
    expect([...iter.filter([1, 2, 3, 4], (num) => (num & 1) == 1)]).toEqual([1, 3]);
});

test("filterMap", () => {
    expect([...iter.filterMap([1, 2, 3, 4], (num) => (num & 1 ? num + 5 : undefined))]).toEqual([
        6, 8,
    ]);
});

test("enumerate", () => {
    expect([...iter.enumerate(["a", "b", "c"], 1)]).toEqual([
        [1, "a"],
        [2, "b"],
        [3, "c"],
    ]);
});
