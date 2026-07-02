// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { expect, test } from "vitest";
import { type Position } from "../geo.ts";
import {
    MatchAreaQuestion,
    MatchPointQuestion,
    MeasureQuestion,
    RadarQuestion,
    TentaclesQuestion,
    ThermometerQuestion,
} from "./index.ts";

/** Mock question root A, 12.076 km from root B, EPWA airport */
const rootA: Position = [20.974356, 52.168667];

/** Mock question root B, 12.076 km from root A, EPBC airport */
const rootB: Position = [20.907217, 52.269183];

const roots = turf.featureCollection([
    turf.point(rootA, { id: "epwa", name: "EPWA" }),
    turf.point(rootB, { id: "epbc", name: "EPBC" }),
]);

/** Mock station A, 3.181 km from root A, 8.989 km from root B, W-wa Rakowiec */
const stationA = [20.966035, 52.196817];

/** Mock station B, 11.632 km from root A, 2.581 km from root B, Piaski */
const stationB = [20.944928, 52.271708];

/** Mock station C, 7.085 km from root A, 7.159 km from root B, W-wa Ursus Płn. */
const stationC = [20.889771, 52.205692];

const stations = turf.featureCollection([
    turf.point(stationA, { id: "A", name: "A" }),
    turf.point(stationB, { id: "B", name: "B" }),
    turf.point(stationC, { id: "C", name: "C" }),
]);

test("MatchAreaQuestion.categorize", () => {
    const area = turf.buffer(turf.point(rootA), 7);
    if (area === undefined) throw new Error("turf.buffer around rootA is undefined");

    const q = new MatchAreaQuestion({
        candidates: turf.featureCollection([turf.feature(area.geometry, { id: "test-area" })]),
        candidatesName: "artificial",
        seekers: rootA,
    });

    expect(
        q.categorizeFeatures(stations, 0).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "hit" }], [{ id: "miss" }], [{ id: "miss" }]]);

    expect(
        q.categorizeFeatures(stations, 0.4).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "hit" }], [{ id: "miss" }], [{ id: "hit" }, { id: "miss" }]]);
});

test("MatchPointQuestion.categorize", () => {
    const q = new MatchPointQuestion({
        candidates: roots,
        candidatesName: "airport",
        seekers: rootA,
    });

    expect(
        q.categorizeFeatures(stations, 0).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "hit" }], [{ id: "miss" }], [{ id: "hit" }]]);

    expect(
        q.categorizeFeatures(stations, 0.4).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "hit" }], [{ id: "miss" }], [{ id: "hit" }, { id: "miss" }]]);
});

test("MeasureQuestion.categorize", () => {
    const q = new MeasureQuestion({
        candidates: roots,
        candidatesName: "airport",
        seekers: translate(rootA, 3, 90),
    });

    expect(
        q.categorizeFeatures(stations, 0).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "further" }], [{ id: "closer" }], [{ id: "further" }]]);

    expect(
        q.categorizeFeatures(stations, 0.4).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "closer" }, { id: "further" }], [{ id: "closer" }], [{ id: "further" }]]);
});

test("RadarQuestion.categorize", () => {
    const q = new RadarQuestion({
        seekers: rootA,
        distance: 7,
    });

    expect(
        q.categorizeFeatures(stations, 0).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "hit" }], [{ id: "miss" }], [{ id: "miss" }]]);

    expect(
        q.categorizeFeatures(stations, 0.4).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "hit" }], [{ id: "miss" }], [{ id: "hit" }, { id: "miss" }]]);
});

test("ThermometerQuestion.categorize", () => {
    const distance = turf.distance(rootA, rootB);
    const azimuth = turf.bearingToAzimuth(turf.bearing(rootA, rootB));

    const q = new ThermometerQuestion({ seekers: rootA, azimuth, distance });

    expect(
        q.categorizeFeatures(stations, 0).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "colder" }], [{ id: "hotter" }], [{ id: "colder" }]]);

    expect(
        q.categorizeFeatures(stations, 0.4).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "colder" }], [{ id: "hotter" }], [{ id: "colder" }, { id: "hotter" }]]);
});

test("TentaclesQuestion.categorize", () => {
    const root: Position = [0.0, 0.0];
    const candidateA = translate(root, 1, 60);
    const candidateB = translate(root, 1, 180);
    const candidateC = translate(root, 1, 300);

    // The candidates form an equilateral triangle (with sides √3 km) inscribed in a circle
    // of radius 1km. The voronoi diagram is therefore trivial, formed by 3 rays, all going
    // from the root at angles: 0°, 120° and 240°.

    const q = new TentaclesQuestion({
        candidates: turf.featureCollection([
            turf.point(candidateA, { id: "A", name: "Feature A" }),
            turf.point(candidateB, { id: "B" }),
            turf.point(candidateC, { id: "C", name: "Feature C" }),
        ]),
        candidatesName: "abstract",
        seekers: root,
        distance: 2,
    });

    const points = turf.featureCollection([
        turf.point(translate(root, 3, 0), { id: "miss" }),
        turf.point(translate(root, 0.8, 45), { id: "closeToA" }),
        turf.point(translate(root, 1.55, 175), { id: "closeToB" }),
        turf.point(translate(root, 1.2, 235), { id: "closeToBC" }),
        turf.point(translate(root, 1.8, 315), { id: "closeToCwithMiss" }),
        turf.point(translate(root, 2.3, 3), { id: "closeToACwithMiss" }),
        turf.point(translate(root, 0.1, 42), { id: "closeToABC" }),
    ]);

    expect(
        q.categorizeFeatures(points, 0).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([
        [{ id: "__nil", name: "(nil answer)" }],
        [{ id: "A", name: "Feature A" }],
        [{ id: "B" }],
        [{ id: "B" }],
        [{ id: "C", name: "Feature C" }],
        [{ id: "__nil", name: "(nil answer)" }],
        [{ id: "A", name: "Feature A" }],
    ]);

    expect(
        q.categorizeFeatures(points, 0.4).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([
        [{ id: "__nil", name: "(nil answer)" }],
        [{ id: "A", name: "Feature A" }],
        [{ id: "B" }],
        [{ id: "B" }, { id: "C", name: "Feature C" }],
        [
            { id: "__nil", name: "(nil answer)" },
            { id: "C", name: "Feature C" },
        ],
        [
            { id: "__nil", name: "(nil answer)" },
            { id: "A", name: "Feature A" },
            { id: "C", name: "Feature C" },
        ],
        [{ id: "A", name: "Feature A" }, { id: "B" }, { id: "C", name: "Feature C" }],
    ]);
});

test("TentaclesQuestion.categorize.covering", () => {
    const root: Position = [0.0, 0.0];
    const candidateA = translate(root, 0.5, 270);
    const candidateB = translate(root, 0.6, 270);

    const q = new TentaclesQuestion({
        candidates: turf.featureCollection([
            turf.point(candidateA, { id: "A" }),
            turf.point(candidateB, { id: "B" }),
        ]),
        candidatesName: "abstract",
        seekers: root,
        distance: 2,
    });

    const points = turf.featureCollection([turf.point(root, { id: "onlyA" })]);

    expect(
        q.categorizeFeatures(points, 0.5).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([[{ id: "A" }]]);
});

function translate(pt: Position, distance: number, direction: number): Position {
    return turf.transformTranslate(turf.point(pt), distance, direction).geometry
        .coordinates as Position;
}
