// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, test } from "vitest";
import { bufferBBox, soleDivision } from "./area";

test(bufferBBox, () => {
    const [minLon, minLat, maxLon, maxLat] = bufferBBox([21, 51, 22, 52], 100);
    expect(minLon).toBeCloseTo(19.585, 3);
    expect(minLat).toBeCloseTo(50.101, 3);
    expect(maxLon).toBeCloseTo(23.476, 3);
    expect(maxLat).toBeCloseTo(52.899, 3);
});

test(soleDivision, () => {
    const collection = soleDivision([21, 51, 22, 52], "square");
    expect(collection.features.length).toStrictEqual(1);

    const p = collection.features[0];
    expect(p.properties).toStrictEqual({ id: "square", answer: "square" });
    expect(p.bbox).toStrictEqual([21, 51, 22, 52]);
    expect(p.geometry.type).toStrictEqual("Polygon");
    expect(p.geometry.coordinates).toStrictEqual([
        [
            [21, 51],
            [22, 51],
            [22, 52],
            [21, 52],
            [21, 51],
        ],
    ]);
});
