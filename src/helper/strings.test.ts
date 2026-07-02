// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later
/// <reference lib="deno.ns" />

import { expect } from "@std/expect";
import { toString } from "./strings.ts";

Deno.test("toString", () => {
    const matrix = [
        ["hello", "hello"],
        [42, "42"],
        [true, "true"],
        [new Error("failed"), "Error: failed"],
        [null, "null"],
        [undefined, "undefined"],
    ] as const;

    for (const [obj, expected] of matrix) {
        expect(toString(obj)).toStrictEqual(expected);
    }
});
