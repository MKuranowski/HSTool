// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later
/// <reference lib="deno.ns" />

import { expect, fn } from "@std/expect";
import { ArraySignal, MapSignal, SetSignal } from "./signal.ts";

Deno.test("ArraySignal", () => {
    const s = new ArraySignal<number>();

    expect(s.pop()).toStrictEqual(undefined);

    s.push(1, 2, 3);
    expect(s.value).toEqual([1, 2, 3]);

    s.reverse();
    expect(s.value).toEqual([3, 2, 1]);

    expect(s.shift()).toEqual(3);
    expect(s.value).toEqual([2, 1]);

    s.sort();
    expect(s.value).toEqual([1, 2]);

    s.unshift(-1, 0);
    expect(s.value).toEqual([-1, 0, 1, 2]);

    expect(s.splice(1, 2, 0.25, 0.75)).toEqual([0, 1]);
    expect(s.value).toEqual([-1, 0.25, 0.75, 2]);

    expect(s.pop()).toEqual(2);
    expect(s.value).toEqual([-1, 0.25, 0.75]);
});

Deno.test("SetSignal", () => {
    const s = new SetSignal<string>();

    s.add("foo").add("bar").add("baz");
    expect(s.value).toEqual(new Set(["foo", "bar", "baz"]));

    expect(s.delete("foo")).toBeTruthy();
    expect(s.delete("spam")).toBeFalsy();
    expect(s.value).toEqual(new Set(["bar", "baz"]));

    s.clear();
    expect(s.value).toEqual(new Set());
});

Deno.test("MapSignal", () => {
    const s = new MapSignal<number, string>();

    s.set(1, "I").set(2, "II").set(3, "III").set(4, "IV").set(5, "V");
    expect(s.value).toEqual(
        new Map<number, string>([
            [1, "I"],
            [2, "II"],
            [3, "III"],
            [4, "IV"],
            [5, "V"],
        ]),
    );

    expect(s.delete(5)).toBeTruthy();
    expect(s.delete(0)).toBeFalsy();
    expect(s.value).toEqual(
        new Map<number, string>([
            [1, "I"],
            [2, "II"],
            [3, "III"],
            [4, "IV"],
        ]),
    );

    expect(s.getOrInsert(1, "I")).toEqual("I");
    expect(s.getOrInsert(5, "V")).toEqual("V");
    expect(s.value).toEqual(
        new Map<number, string>([
            [1, "I"],
            [2, "II"],
            [3, "III"],
            [4, "IV"],
            [5, "V"],
        ]),
    );

    const stringer = fn((num: number) => "V" + "I".repeat(num - 5)) as (_: number) => string;

    expect(s.getOrInsertComputed(5, stringer)).toEqual("V");
    expect(stringer).not.toHaveBeenCalled();

    expect(s.getOrInsertComputed(7, stringer)).toEqual("VII");
    expect(stringer).toHaveBeenCalled();

    expect(s.value).toEqual(
        new Map<number, string>([
            [1, "I"],
            [2, "II"],
            [3, "III"],
            [4, "IV"],
            [5, "V"],
            [7, "VII"],
        ]),
    );

    s.clear();
    expect(s.value).toEqual(new Map());
});
