// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";

export const position = z.tuple([
    z.number().min(-180).max(180).describe("WGS-84 longitude"),
    z.number().min(-90).max(90).describe("WGS-84 latitude"),
]);

export const point = z.object({
    type: z.literal("Point"),
    coordinates: position,
});

export const lineString = z.object({
    type: z.literal("LineString"),
    coordinates: z.array(position),
});

export const polygon = z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(position)),
});

export const multiPolygon = z.object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(z.array(z.array(position))),
});

export const withID = z.looseObject({
    id: z.string(),
    name: z.string().optional(),
});

export const withName = z.looseObject({
    id: z.string(),
    name: z.string(),
});

export const anyGeometry = z.union([
    z.object({ type: z.string(), coordinates: z.array(z.unknown()) }),
    z.object({
        type: z.literal("GeometryCollection"),
        geometries: z.array(z.unknown()),
    }),
]);

export const anyFeature = z.looseObject({
    type: z.literal("Feature"),
    geometry: anyGeometry,
});

export const anyFeatureCollection = z.looseObject({
    type: z.literal("FeatureCollection"),
    features: z.array(anyFeature),
});

export const preset = z.object({
    name: z.string(),
    stations: z.object({
        type: z.literal("FeatureCollection"),
        features: z.array(
            z.object({
                type: z.literal("Feature"),
                geometry: point,
                properties: withName,
            }),
        ),
    }),
    points: z
        .record(
            z.string(),
            z.object({
                type: z.literal("FeatureCollection"),
                features: z.array(
                    z.object({
                        type: z.literal("Feature"),
                        geometry: point,
                        properties: withID,
                    }),
                ),
            }),
        )
        .optional(),
    lines: z
        .record(
            z.string(),
            z.object({
                type: z.literal("FeatureCollection"),
                features: z.array(
                    z.object({
                        type: z.literal("Feature"),
                        geometry: lineString,
                        properties: withID,
                    }),
                ),
            }),
        )
        .optional(),
    areas: z
        .record(
            z.string(),
            z.object({
                type: z.literal("FeatureCollection"),
                features: z.array(
                    z.object({
                        type: z.literal("Feature"),
                        geometry: z.union([polygon, multiPolygon]),
                        properties: withID,
                    }),
                ),
            }),
        )
        .optional(),
    overlay: anyFeatureCollection.optional(),
});

export type PropertiesWithID = z.infer<typeof withID>;
export type PropertiesWithName = z.infer<typeof withName>;
export type Preset = z.infer<typeof preset>;
