// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { expect, test } from "vitest";
import { withProperties, withPropertiesInCollection } from "./prop.ts";

test("withProperties", () => {
    const f1 = turf.point([21, 52], { foo: "bar", spam: "eggs" });
    const f2 = withProperties(f1, { foo: "baz", universe: 42 });
    expect(f2.properties).toStrictEqual({ foo: "baz", spam: "eggs", universe: 42 });
});

test("withPropertiesInCollection", () => {
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
