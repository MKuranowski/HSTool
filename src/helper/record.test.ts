// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, test } from "vitest";
import * as record from "./record";

test(record.add, () => {
    expect(record.add({ a: undefined }, "a", "b", "c")).toStrictEqual({
        a: undefined,
        b: undefined,
        c: undefined,
    });
});

test(record.remove, () => {
    expect(
        record.remove({ a: undefined, b: undefined, c: undefined }, "b", "c", "d"),
    ).toStrictEqual({
        a: undefined,
    });
});

test(record.new_, () => {
    expect(record.new_()).toStrictEqual({});
    expect(record.new_("a", "b", "c")).toStrictEqual({ a: undefined, b: undefined, c: undefined });
});

test(record.union, () => {
    expect(
        record.union(
            { a: undefined },
            { b: undefined, c: undefined },
            { a: undefined, c: undefined },
        ),
    ).toStrictEqual({ a: undefined, b: undefined, c: undefined });
});

test(record.length, () => {
    expect(record.length({})).toStrictEqual(0);
    expect(record.length({ a: undefined, b: undefined })).toStrictEqual(2);
});

test(record.iter, () => {
    expect(record.iter({ a: undefined, b: undefined, c: undefined })).toStrictEqual([
        "a",
        "b",
        "c",
    ]);
});

test(record.contains, () => {
    const r: Record<string, undefined> = { a: undefined, b: undefined, c: undefined };
    expect(record.contains(r, "a")).toBeTruthy();
    expect(record.contains(r, "d")).toBeFalsy();
});
