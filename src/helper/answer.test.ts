// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { expect, test } from "vitest";
import { categorizeBinary, hasAnswer, withAnswers, withPossibleAnswers } from "./answer.ts";

test("withPossibleAnswers", () => {
    const c1 = turf.featureCollection([
        turf.point([20.97, 52.17], { iata: "WAW" }),
        turf.point([20.65, 52.45], { iata: "WMI" }),
    ]);
    const c2 = withPossibleAnswers(c1, (f) => [
        { id: f.properties.iata === "WAW" ? "good" : "bad" },
    ]);

    expect(c2.features).toStrictEqual([
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.97, 52.17] },
            properties: { iata: "WAW", possibleAnswers: [{ id: "good" }] },
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.65, 52.45] },
            properties: { iata: "WMI", possibleAnswers: [{ id: "bad" }] },
        },
    ]);
});

test("withAnswers", () => {
    const c1 = turf.featureCollection([
        turf.point([20.97, 52.17], { id: "WAW" }),
        turf.point([20.65, 52.45], { id: "WMI" }),
    ]);
    const c2 = withAnswers(c1, (f) => ({ id: f.properties.id === "WAW" ? "good" : "bad" }));

    expect(c2.features).toStrictEqual([
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.97, 52.17] },
            properties: { id: "WAW", answer: { id: "good" } },
        },
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [20.65, 52.45] },
            properties: { id: "WMI", answer: { id: "bad" } },
        },
    ]);
});

test("categorizeBinary", () => {
    const ref = turf.point([21.01, 52.231]);
    const points = [
        turf.point([21.003, 52.229], { name: "Warszawa Centralna" }),
        turf.point([20.97, 52.17], { name: "WAW" }),
        turf.point([20.65, 52.45], { name: "WMI" }),
    ];

    // "hit" when within 7 km of `ref`, "miss" otherwise
    const exactCategorizer = (pt: turf.Coord) =>
        categorizeBinary(turf.distance(pt, ref) - 7, 0, { id: "hit" }, { id: "miss" });
    expect(points.map((pt) => exactCategorizer(pt))).toStrictEqual([
        [{ id: "hit" }],
        [{ id: "miss" }],
        [{ id: "miss" }],
    ]);

    // "hit" when within 7 km of `ref`, "miss" otherwise; with 0.5 km tolerance
    const fuzzyCategorizer = (pt: turf.Coord) =>
        categorizeBinary(turf.distance(pt, ref) - 7, 0.5, { id: "hit" }, { id: "miss" });
    expect(points.map((pt) => fuzzyCategorizer(pt))).toStrictEqual([
        [{ id: "hit" }],
        [{ id: "hit" }, { id: "miss" }],
        [{ id: "miss" }],
    ]);
});

test("hasAnswer", () => {
    expect(hasAnswer([{ id: "hit" }], "hit")).toEqual(true);
    expect(hasAnswer([{ id: "hit" }], "miss")).toEqual(false);
    expect(hasAnswer([{ id: "hit", name: "miss" }], "miss")).toEqual(false);
    expect(hasAnswer([], "miss")).toEqual(false);
    expect(hasAnswer([{ id: "hit" }, { id: "miss" }], "miss")).toEqual(true);
});
