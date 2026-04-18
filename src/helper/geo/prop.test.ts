// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { expect, test } from "vitest";
import {
    binaryCategorizer,
    mergePositions,
    withPossibleAnswers,
    withProperties,
    withPropertiesInCollection,
} from "./prop";

test(withProperties, () => {
    const f1 = turf.point([21, 52], { foo: "bar", spam: "eggs" });
    const f2 = withProperties(f1, { foo: "baz", universe: 42 });
    expect(f2.properties).toStrictEqual({ foo: "baz", spam: "eggs", universe: 42 });
});

test(withPropertiesInCollection, () => {
    const c1 = turf.featureCollection([
        turf.point([20.97, 52.17], { iata: "WAW" }),
        turf.point([20.65, 52.45], { iata: "WMI" }),
    ]);
    const c2 = withPropertiesInCollection(c1, (f) => ({
        icao: f.properties.iata === "WAW" ? "EPWA" : "EPMO",
    }));

    expect(c2.features).toStrictEqual([
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.97, 52.17] },
            properties: { iata: "WAW", icao: "EPWA" },
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.65, 52.45] },
            properties: { iata: "WMI", icao: "EPMO" },
        },
    ]);
});

test(withPossibleAnswers, () => {
    const c1 = turf.featureCollection([
        turf.point([20.97, 52.17], { iata: "WAW" }),
        turf.point([20.65, 52.45], { iata: "WMI" }),
    ]);
    const c2 = withPossibleAnswers(c1, (f) => [f.properties.iata === "WAW" ? "good" : "bad"]);

    expect(c2.features).toStrictEqual([
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.97, 52.17] },
            properties: { iata: "WAW", possibleAnswers: ["good"] },
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.65, 52.45] },
            properties: { iata: "WMI", possibleAnswers: ["bad"] },
        },
    ]);
});

test(binaryCategorizer, () => {
    const ref = turf.point([21.01, 52.231]);
    const points = [
        turf.point([21.003, 52.229], { name: "Warszawa Centralna" }),
        turf.point([20.97, 52.17], { name: "WAW" }),
        turf.point([20.65, 52.45], { name: "WMI" }),
    ];

    // "hit" when within 7 km of `ref`, "miss" otherwise
    const exactCategorizer = binaryCategorizer(
        (pt) => turf.distance(pt, ref) - 7,
        0,
        "hit",
        "miss",
    );
    expect(points.map((pt) => exactCategorizer(pt))).toStrictEqual([["hit"], ["miss"], ["miss"]]);

    // "hit" when within 7 km of `ref`, "miss" otherwise; with 0.5 km tolerance
    const fuzzyCategorizer = binaryCategorizer(
        (pt) => turf.distance(pt, ref) - 7,
        0.5,
        "hit",
        "miss",
    );
    expect(points.map((pt) => fuzzyCategorizer(pt))).toStrictEqual([
        ["hit"],
        ["hit", "miss"],
        ["miss"],
    ]);
});

test.each([
    [
        [21.01, 52.231],
        [21.003, 52.229],
        [21.003, 52.229],
    ],
    [
        [21.01, 52.231],
        [null, 52.229],
        [21.01, 52.229],
    ],
    [
        [21.01, 52.231, 100],
        [21.003, 52.229],
        [21.003, 52.229, 100],
    ],
])(mergePositions, (old, new_, expected) => {
    expect(mergePositions(old, new_)).toStrictEqual(expected);
});
