// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";
import {
    anyPolygon,
    feature,
    featureCollection,
    lineString,
    point,
    position,
    withID,
} from "../schema";
import { CustomQuestion } from "./custom";
import { MatchAreaQuestion } from "./matchArea";
import { MatchPointQuestion } from "./matchPoint";
import { MeasureQuestion } from "./measure";
import { RadarQuestion } from "./radar";
import { TentaclesQuestion } from "./tentacles";
import { ThermometerQuestion } from "./thermometer";

export const customQuestion = z.codec(
    z.object({
        kind: z.literal("custom"),
        name: z.string(),
    }),
    z.instanceof(CustomQuestion),
    {
        decode: (value) => new CustomQuestion(value.name),
        encode: (value) => {
            return {
                kind: "custom" as const,
                name: value.name,
            };
        },
    },
);

export const matchAreaQuestion = z.codec(
    z.object({
        kind: z.literal("match-area"),
        area: feature(anyPolygon, withID),
    }),
    z.instanceof(MatchAreaQuestion),
    {
        decode: (value) => new MatchAreaQuestion(value.area),
        encode: (value) => {
            return {
                kind: "match-area" as const,
                area: value.area,
            };
        },
    },
);

export const matchPointQuestion = z.codec(
    z.object({
        kind: z.literal("match-point"),
        presetName: z.string(),
        candidates: featureCollection(point, withID),
        seeker: position,
    }),
    z.instanceof(MatchPointQuestion),
    {
        decode: (value) => new MatchPointQuestion(value.presetName, value.candidates, value.seeker),
        encode: (value) => {
            return {
                kind: "match-point" as const,
                presetName: value.presetName,
                candidates: value.candidates,
                seeker: value.seeker,
            };
        },
    },
);

export const measureQuestion = z.codec(
    z.object({
        kind: z.literal("measure"),
        presetName: z.string(),
        candidates: featureCollection(z.discriminatedUnion("type", [point, lineString]), withID),
        seeker: position,
    }),
    z.instanceof(MeasureQuestion),
    {
        decode: (value) => new MeasureQuestion(value.presetName, value.candidates, value.seeker),
        encode: (value) => {
            return {
                kind: "measure" as const,
                presetName: value.presetName,
                candidates: value.candidates,
                seeker: value.seeker,
            };
        },
    },
);

export const radarQuestion = z.codec(
    z.object({
        kind: z.literal("radar"),
        seeker: position,
        radius: z.number().nonnegative(),
    }),
    z.instanceof(RadarQuestion),
    {
        decode: (value) => new RadarQuestion(value.seeker, value.radius),
        encode: (value) => {
            return {
                kind: "radar" as const,
                seeker: value.seeker,
                radius: value.radius,
            };
        },
    },
);

export const tentaclesQuestion = z.codec(
    z.object({
        kind: z.literal("tentacles"),
        presetName: z.string(),
        candidates: featureCollection(point, withID),
        seeker: position,
        radius: z.number().nonnegative(),
    }),
    z.instanceof(TentaclesQuestion),
    {
        decode: (value) =>
            new TentaclesQuestion(value.presetName, value.candidates, value.seeker, value.radius),
        encode: (value) => {
            return {
                kind: "tentacles" as const,
                presetName: value.presetName,
                candidates: value.candidates,
                seeker: value.seeker,
                radius: value.radius,
            };
        },
    },
);

export const thermometerQuestion = z.codec(
    z.object({
        kind: z.literal("thermometer"),
        start: position,
        end: position,
    }),
    z.instanceof(ThermometerQuestion),
    {
        decode: (value) => new ThermometerQuestion(value.start, value.end),
        encode: (value) => {
            return {
                kind: "thermometer" as const,
                start: value.start,
                end: value.end,
            };
        },
    },
);

export const question = z.discriminatedUnion("kind", [
    customQuestion,
    matchAreaQuestion,
    matchPointQuestion,
    measureQuestion,
    radarQuestion,
    tentaclesQuestion,
    thermometerQuestion,
]);

export type SerializableQuestion = ReturnType<typeof question.parse>;
