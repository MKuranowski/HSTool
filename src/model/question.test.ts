// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, test } from "vitest";
import * as turf from "@turf/turf";
import {
    MatchAreaQuestion,
    MatchPointQuestion,
    MeasureQuestion,
    RadarQuestion,
    TentaclesQuestion,
    ThermometerQuestion,
} from "./question";
import type { Position } from "geojson";

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

test(MatchAreaQuestion, () => {
    const area = turf.buffer(turf.point(rootA), 7);
    if (area === undefined) throw new Error("turf.buffer around rootA is undefined");

    const q = new MatchAreaQuestion({
        type: "Feature",
        geometry: area.geometry,
        properties: { id: "test-area" },
    });

    expect(q.categorizePoint(stationA, 0)).toEqual("hit");
    expect(q.categorizePoint(stationB, 0)).toEqual("miss");
    expect(q.categorizePoint(stationC, 0)).toEqual("miss");

    expect(q.categorizePoint(stationA, 0.4)).toEqual("hit");
    expect(q.categorizePoint(stationB, 0.4)).toEqual("miss");
    expect(q.categorizePoint(stationC, 0.4)).toEqual(null);
});

test(MatchPointQuestion, () => {
    const q = new MatchPointQuestion("airport", roots, rootB);

    expect(q.closest.properties.id).toEqual("epbc");

    q.seeker = rootA;
    expect(q.closest.properties.id).toEqual("epwa");

    expect(q.categorizePoint(stationA, 0)).toEqual("hit");
    expect(q.categorizePoint(stationB, 0)).toEqual("miss");
    expect(q.categorizePoint(stationC, 0)).toEqual("hit");

    expect(q.categorizePoint(stationA, 0.4)).toEqual("hit");
    expect(q.categorizePoint(stationB, 0.4)).toEqual("miss");
    expect(q.categorizePoint(stationC, 0.4)).toEqual(null);
});

test(MeasureQuestion, () => {
    const q = new MeasureQuestion("airport", roots, translate(rootA, 3.0, 90));

    expect(q.distance).toBeCloseTo(3.0);

    expect(q.categorizePoint(stationA, 0)).toEqual("further");
    expect(q.categorizePoint(stationB, 0)).toEqual("closer");
    expect(q.categorizePoint(stationC, 0)).toEqual("further");

    expect(q.categorizePoint(stationA, 0.4)).toEqual(null);
    expect(q.categorizePoint(stationB, 0.4)).toEqual("closer");
    expect(q.categorizePoint(stationC, 0.4)).toEqual("further");

    q.seeker = translate(rootA, 4.0, 90);
    expect(q.distance).toBeCloseTo(4.0);

    expect(q.categorizePoint(stationA, 0.5)).toEqual("closer");
    expect(q.categorizePoint(stationB, 0.5)).toEqual("closer");
    expect(q.categorizePoint(stationC, 0.5)).toEqual("further");
});

test(RadarQuestion, () => {
    const q = new RadarQuestion(rootA, 7.0);

    expect(q.categorizePoint(stationA, 0)).toEqual("hit");
    expect(q.categorizePoint(stationB, 0)).toEqual("miss");
    expect(q.categorizePoint(stationC, 0)).toEqual("miss");

    expect(q.categorizePoint(stationA, 0.4)).toEqual("hit");
    expect(q.categorizePoint(stationB, 0.4)).toEqual("miss");
    expect(q.categorizePoint(stationC, 0.4)).toEqual(null);
});

test(ThermometerQuestion, () => {
    const q = new ThermometerQuestion(rootA, rootB);

    expect(q.categorizePoint(stationA, 0)).toEqual("colder");
    expect(q.categorizePoint(stationB, 0)).toEqual("hotter");
    expect(q.categorizePoint(stationC, 0)).toEqual("colder");

    expect(q.categorizePoint(stationA, 0.4)).toEqual("colder");
    expect(q.categorizePoint(stationB, 0.4)).toEqual("hotter");
    expect(q.categorizePoint(stationC, 0.4)).toEqual(null);
});

test(TentaclesQuestion, () => {
    const root = [0.0, 0.0];
    const candidateA = translate(root, 1, 60);
    const candidateB = translate(root, 1, 180);
    const candidateC = translate(root, 1, 300);

    // The candidates form an equilateral triangle (with sides √3 km) inscribed in a circle
    // of radius 1km. The voronoi diagram is therefore trivial, formed by 3 rays, all going
    // from the root at angles: 0°, 120° and 240°.

    const q = new TentaclesQuestion(
        "abstract",
        turf.featureCollection([
            turf.point(candidateA, { id: "A" }),
            turf.point(candidateB, { id: "B" }),
            turf.point(candidateC, { id: "C" }),
        ]),
        2.0,
        root,
    );

    const miss = translate(root, 3, 0);
    expect(q.categorizePoint(miss, 0)).toEqual("(nil)");
    expect(q.categorizePoint(miss, 0.4)).toEqual("(nil)");

    const closeToA = translate(root, 0.8, 45);
    expect(q.categorizePoint(closeToA, 0)).toEqual("A");
    expect(q.categorizePoint(closeToA, 0.4)).toEqual("A");

    const closeToB = translate(root, 1.55, 175);
    expect(q.categorizePoint(closeToB, 0)).toEqual("B");
    expect(q.categorizePoint(closeToB, 0.4)).toEqual("B");

    const closeToBC = translate(root, 1.2, 235);
    expect(q.categorizePoint(closeToBC, 0)).toEqual("B");
    expect(q.categorizePoint(closeToBC, 0.4)).toEqual("B;C");

    const closeToCwithMiss = translate(root, 1.8, 315);
    expect(q.categorizePoint(closeToCwithMiss, 0)).toEqual("C");
    expect(q.categorizePoint(closeToCwithMiss, 0.4)).toEqual("(nil);C");

    const closeToACwithMiss = translate(root, 2.3, 3);
    expect(q.categorizePoint(closeToACwithMiss, 0)).toEqual("(nil)");
    expect(q.categorizePoint(closeToACwithMiss, 0.4)).toEqual("(nil);A;C");

    const closeToABC = translate(root, 0.1, 42);
    expect(q.categorizePoint(closeToABC, 0)).toEqual("A");
    expect(q.categorizePoint(closeToABC, 0.4)).toEqual("A;B;C");
});

function translate(pt: Position, distance: number, direction: number): Position {
    return turf.transformTranslate(turf.point(pt), distance, direction).geometry.coordinates;
}
