// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";

export const latLonSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

export const posSchema = z.number().array().length(2);

export const pointSchema = z.object({
    type: z.literal("Point"),
    coordinates: posSchema,
});

export const multiPointSchema = z.object({
    type: z.literal("MultiPoint"),
    coordinates: posSchema.array(),
});

export const lineStringSchema = z.object({
    type: z.literal("LineString"),
    coordinates: posSchema.array(),
});

export const multiLineStringSchema = z.object({
    type: z.literal("MultiLineString"),
    coordinates: posSchema.array().array(),
});

export const polygonSchema = z.object({
    type: z.literal("Polygon"),
    coordinates: posSchema.array().array(),
});

export const multiPolygonSchema = z.object({
    type: z.literal("MultiPolygon"),
    coordinates: posSchema.array().array().array(),
});

export const pointOrLineSchema = z.discriminatedUnion("type", [pointSchema, lineStringSchema]);

export const areaSchema = z.discriminatedUnion("type", [polygonSchema, multiPolygonSchema]);

export const geometrySchema = z.discriminatedUnion("type", [
    pointSchema,
    multiPointSchema,
    lineStringSchema,
    multiLineStringSchema,
    polygonSchema,
    multiPolygonSchema,
]);

export const propsWithId = z.object({
    id: z.string(),
    name: z.string().optional(),
});

export const propsWithName = z.object({
    id: z.string(),
    name: z.string(),
});

export const propsAny = z.record(z.string(), z.any()).nullable();

export function featureSchema<G extends z.ZodType, P extends z.ZodType>(
    geometry: G,
    properties: P,
) {
    return z.object({
        type: z.literal("Feature"),
        geometry,
        properties,
    });
}

export function featureCollectionSchema<G extends z.ZodType, P extends z.ZodType>(
    geometry: G,
    properties: P,
) {
    return z.object({
        type: z.literal("FeatureCollection"),
        features: featureSchema(geometry, properties).array(),
    });
}

export const anyFeatureSchema = featureSchema(geometrySchema, propsAny);

export const anyFeatureCollectionSchema = featureCollectionSchema(geometrySchema, propsAny);
