// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as nanostores from "nanostores";
import { afterEach, expect, test } from "vitest";
import * as z from "zod";
import { arrayAtom, setAtom, zodJson } from "./store";

const $mockArr = arrayAtom(nanostores.atom<number[]>([]));
const $mockSet = setAtom(nanostores.atom({}));

afterEach(() => {
    nanostores.cleanStores();
});

test(arrayAtom, () => {
    $mockArr.push(1, 2, 3);
    expect($mockArr.get()).toStrictEqual([1, 2, 3]);

    expect($mockArr.pop()).toStrictEqual(3);
    expect($mockArr.get()).toStrictEqual([1, 2]);

    $mockArr.unshift(-1, 0);
    expect($mockArr.get()).toStrictEqual([-1, 0, 1, 2]);

    expect($mockArr.shift()).toStrictEqual(-1);
    expect($mockArr.get()).toStrictEqual([0, 1, 2]);

    expect($mockArr.remove(1)).toStrictEqual(1);
    expect($mockArr.get()).toStrictEqual([0, 2]);

    $mockArr.splice(1, 1, 42, 314);
    expect($mockArr.get()).toStrictEqual([0, 42, 314]);

    $mockArr.replace(2, -5);
    expect($mockArr.get()).toStrictEqual([0, 42, -5]);
});

test(setAtom, () => {
    $mockSet.add("foo", "bar", "baz");
    expect($mockSet.get()).toStrictEqual({ foo: 1, bar: 1, baz: 1 });

    $mockSet.remove("baz", "spam", "eggs");
    expect($mockSet.get()).toStrictEqual({ foo: 1, bar: 1 });

    $mockSet.add("foo", "spam");
    expect($mockSet.get()).toStrictEqual({ foo: 1, bar: 1, spam: 1 });
});

test(zodJson, () => {
    const schema = zodJson(
        z.object({
            name: z.string(),
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
            codes: z
                .codec(z.array(z.string()), z.set(z.string()), {
                    decode: (arr) => new Set(arr),
                    encode: (set) => [...set.keys()],
                })
                .optional(),
        }),
    );

    const json = '{"name":"Warsaw-Chopin","lat":52.166,"lon":20.967,"codes":["EPWA","WAW"]}';
    const obj = {
        name: "Warsaw-Chopin",
        lat: 52.166,
        lon: 20.967,
        codes: new Set(["EPWA", "WAW"]),
    };

    expect(schema.decode(json)).toStrictEqual(obj);
    expect(schema.encode(obj)).toStrictEqual(json);
});
