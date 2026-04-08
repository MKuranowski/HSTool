// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { Position } from "geojson";
import { expect, test } from "vitest";
import * as MatchAreaQuestion from "./MatchAreaQuestion";
import * as MatchPointQuestion from "./MatchPointQuestion";
import * as MeasureQuestion from "./MeasureQuestion";
import * as RadarQuestion from "./RadarQuestion";
import * as TentaclesQuestion from "./TentaclesQuestion";
import * as ThermometerQuestion from "./ThermometerQuestion";

/** Mock question root A, 12.076 km from root B, EPWA airport */
const rootA = [20.974356, 52.168667];

/** Mock question root B, 12.076 km from root A, EPBC airport */
const rootB = [20.907217, 52.269183];

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

test(MatchAreaQuestion.categorize, () => {
    const area = turf.buffer(turf.point(rootA), 7);
    if (area === undefined) throw new Error("turf.buffer around rootA is undefined");

    const q: MatchAreaQuestion.T = {
        kind: "match-area",
        area: {
            type: "Feature",
            geometry: area.geometry,
            properties: { id: "test-area" },
        },
    };

    expect(
        MatchAreaQuestion.categorize(q, stations, 0).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["hit"], ["miss"], ["miss"]]);

    expect(
        MatchAreaQuestion.categorize(q, stations, 0.4).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["hit"], ["miss"], ["hit", "miss"]]);
});

test(MatchPointQuestion.categorize, () => {
    const q: MatchPointQuestion.T = {
        kind: "match-point",
        name: "airport",
        candidates: roots,
        seeker: rootA,
    };

    expect(
        MatchPointQuestion.categorize(q, stations, 0).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["hit"], ["miss"], ["hit"]]);

    expect(
        MatchPointQuestion.categorize(q, stations, 0.4).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["hit"], ["miss"], ["hit", "miss"]]);
});

test(MeasureQuestion.categorize, () => {
    const q: MeasureQuestion.T = {
        kind: "measure",
        name: "airport",
        candidates: roots,
        seeker: translate(rootA, 3, 90),
    };

    expect(
        MeasureQuestion.categorize(q, stations, 0).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["further"], ["closer"], ["further"]]);

    expect(
        MeasureQuestion.categorize(q, stations, 0.4).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["closer", "further"], ["closer"], ["further"]]);
});

test(RadarQuestion.categorize, () => {
    const q: RadarQuestion.T = {
        kind: "radar",
        seeker: rootA,
        radius: 7,
    };

    expect(
        RadarQuestion.categorize(q, stations, 0).features.map((f) => f.properties.possibleAnswers),
    ).toEqual([["hit"], ["miss"], ["miss"]]);

    expect(
        RadarQuestion.categorize(q, stations, 0.4).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["hit"], ["miss"], ["hit", "miss"]]);
});

test(ThermometerQuestion.categorize, () => {
    const q: ThermometerQuestion.T = { kind: "thermometer", start: rootA, end: rootB };

    expect(
        ThermometerQuestion.categorize(q, stations, 0).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["colder"], ["hotter"], ["colder"]]);

    expect(
        ThermometerQuestion.categorize(q, stations, 0.4).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([["colder"], ["hotter"], ["colder", "hotter"]]);
});

test(TentaclesQuestion.categorize, () => {
    const root = [0.0, 0.0];
    const candidateA = translate(root, 1, 60);
    const candidateB = translate(root, 1, 180);
    const candidateC = translate(root, 1, 300);

    // The candidates form an equilateral triangle (with sides √3 km) inscribed in a circle
    // of radius 1km. The voronoi diagram is therefore trivial, formed by 3 rays, all going
    // from the root at angles: 0°, 120° and 240°.

    const q: TentaclesQuestion.T = {
        kind: "tentacles",
        name: "abstract",
        candidates: turf.featureCollection([
            turf.point(candidateA, { id: "A" }),
            turf.point(candidateB, { id: "B" }),
            turf.point(candidateC, { id: "C" }),
        ]),
        seeker: root,
        radius: 2,
    };

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
        TentaclesQuestion.categorize(q, points, 0).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([
        [TentaclesQuestion.NIL],
        ["A"],
        ["B"],
        ["B"],
        ["C"],
        [TentaclesQuestion.NIL],
        ["A"],
    ]);

    expect(
        TentaclesQuestion.categorize(q, points, 0.4).features.map(
            (f) => f.properties.possibleAnswers,
        ),
    ).toEqual([
        [TentaclesQuestion.NIL],
        ["A"],
        ["B"],
        ["B", "C"],
        [TentaclesQuestion.NIL, "C"],
        [TentaclesQuestion.NIL, "A", "C"],
        ["A", "B", "C"],
    ]);
});

function translate(pt: Position, distance: number, direction: number): Position {
    return turf.transformTranslate(turf.point(pt), distance, direction).geometry.coordinates;
}
