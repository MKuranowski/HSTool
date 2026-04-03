// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, test } from "vitest";
import { toString } from "./strings";

test.each([
    ["hello", "hello"],
    [42, "42"],
    [true, "true"],
    [new Error("failed"), "Error: failed"],
    [null, "null"],
    [undefined, "undefined"],
])(toString, (obj, str) => {
    expect(toString(obj)).toStrictEqual(str);
});
