// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";
import {
    areaSchema,
    featureCollectionSchema,
    geometrySchema,
    lineStringSchema,
    pointSchema,
    propsAny,
    propsWithId,
    propsWithName,
} from "./geojson.ts";

function candidateSets<G extends z.ZodType>(geometry: G) {
    return z.record(z.string(), featureCollectionSchema(geometry, propsWithId));
}

export const presetSchema = z.object({
    name: z.string(),
    hidingRadius: z.number().min(0).optional(),
    answerTime: z.number().min(0).optional(),
    photoAnswerTime: z.number().min(0).optional(),
    quickAnswerMultiplier: z.number().min(0).optional(),
    stations: featureCollectionSchema(pointSchema, propsWithName),
    points: candidateSets(pointSchema).optional(),
    lines: candidateSets(lineStringSchema).optional(),
    areas: candidateSets(areaSchema).optional(),
    overlay: featureCollectionSchema(geometrySchema, propsAny).optional(),
});
