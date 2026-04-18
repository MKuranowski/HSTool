// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { expect, test } from "vitest";
import { nearestPointsToCircle } from "./dist";

// no need to test distanceToFeature, we trust turf functions

test(nearestPointsToCircle, () => {
    const root = turf.point([0, 0]);
    const radius = 2;

    const candidates = turf.featureCollection([
        turf.transformTranslate(turf.point([0, 0], { id: "A" }), 0.3, 45),
        turf.transformTranslate(turf.point([0, 0], { id: "B" }), 5.0, 90),
        turf.transformTranslate(turf.point([0, 0], { id: "C" }), 1.7, 180),
        turf.transformTranslate(turf.point([0, 0], { id: "D" }), 2.3, 225),
        turf.transformTranslate(turf.point([0, 0], { id: "E" }), 4.9, 270),
    ]);

    const closest = nearestPointsToCircle(candidates, root.geometry.coordinates, radius);
    expect(closest.features.map((f) => f.properties.id)).toStrictEqual(["A", "C", "D"]);
});
