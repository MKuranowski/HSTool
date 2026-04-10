// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";
import * as Geo from "./Geo";

export type T = z.infer<typeof schema>;

export const schema = z.object({
    name: z.string(),
    stations: Geo.featureCollection(Geo.point, Geo.withName),
    points: z.record(z.string(), Geo.featureCollection(Geo.point, Geo.withID)).optional(),
    lines: z.record(z.string(), Geo.featureCollection(Geo.lineString, Geo.withID)).optional(),
    areas: z.record(z.string(), Geo.featureCollection(Geo.anyPolygon, Geo.withID)).optional(),
    overlay: Geo.anyFeatureCollection.optional(),
});
