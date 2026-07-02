// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";
import {
    CustomQuestion,
    MatchAreaQuestion,
    MatchPointQuestion,
    MeasureQuestion,
    type Question,
    RadarQuestion,
    TentaclesQuestion,
    ThermometerQuestion,
} from "../model/question/index.ts";
import Timestamp from "../model/timestamp.ts";
import {
    areaSchema,
    featureCollectionSchema,
    latLonSchema,
    pointOrLineSchema,
    pointSchema,
    propsWithId,
} from "./geojson.ts";

const timestampSchema = z.codec(
    z.object({
        t: z.iso.datetime(),
        explicit: z.boolean(),
    }),
    z.instanceof(Timestamp),
    {
        decode: ({ t, explicit }) => new Timestamp(t, explicit),
        encode: (t) => ({
            t: t.t.value.toISOString(),
            explicit: t.explicit.value,
        }),
    },
);

const baseSchema = z.object({
    id: z.uuidv7(),
    answeredAt: timestampSchema.optional(),
    askedAt: timestampSchema.optional(),
    inEndGame: z.boolean(),
    answer: z.string().optional(),
});

function encodeQuestionBase(q: Question): z.output<typeof baseSchema> {
    return {
        id: q.id,
        answeredAt: q.answeredAt.value,
        askedAt: q.askedAt.value,
        inEndGame: q.inEndGame.value,
        answer: q.answer.value,
    };
}

export const customQuestionSchema = z.codec(
    baseSchema.extend({
        name: z.string(),
        kind: z.literal("custom"),
    }),
    z.instanceof(CustomQuestion),
    {
        decode: (params) => new CustomQuestion(params),
        encode: (q) => ({
            ...encodeQuestionBase(q),
            name: q.name.value,
            kind: "custom" as const,
        }),
    },
);

export const matchAreaQuestionSchema = z.codec(
    baseSchema.extend({
        seekers: latLonSchema,
        candidates: featureCollectionSchema(areaSchema, propsWithId),
        candidatesName: z.string(),
        kind: z.literal("match-area"),
    }),
    z.instanceof(MatchAreaQuestion),
    {
        decode: (params) => new MatchAreaQuestion(params),
        encode: (q) => ({
            ...encodeQuestionBase(q),
            seekers: q.seekers.value,
            candidates: q.candidates.value,
            candidatesName: q.candidatesName.value,
            kind: "match-area" as const,
        }),
    },
);

export const matchPointQuestionSchema = z.codec(
    baseSchema.extend({
        seekers: latLonSchema,
        candidates: featureCollectionSchema(pointSchema, propsWithId),
        candidatesName: z.string(),
        kind: z.literal("match-point"),
    }),
    z.instanceof(MatchPointQuestion),
    {
        decode: (params) => new MatchPointQuestion(params),
        encode: (q) => ({
            ...encodeQuestionBase(q),
            seekers: q.seekers.value,
            candidates: q.candidates.value,
            candidatesName: q.candidatesName.value,
            kind: "match-point" as const,
        }),
    },
);

export const measureQuestionSchema = z.codec(
    baseSchema.extend({
        seekers: latLonSchema,
        candidates: featureCollectionSchema(pointOrLineSchema, propsWithId),
        candidatesName: z.string(),
        kind: z.literal("measure"),
    }),
    z.instanceof(MeasureQuestion),
    {
        decode: (params) => new MeasureQuestion(params),
        encode: (q) => ({
            ...encodeQuestionBase(q),
            seekers: q.seekers.value,
            candidates: q.candidates.value,
            candidatesName: q.candidatesName.value,
            kind: "measure" as const,
        }),
    },
);

export const radarQuestionSchema = z.codec(
    baseSchema.extend({
        seekers: latLonSchema,
        distance: z.number().min(0),
        kind: z.literal("radar"),
    }),
    z.instanceof(RadarQuestion),
    {
        decode: (params) => new RadarQuestion(params),
        encode: (q) => ({
            ...encodeQuestionBase(q),
            seekers: q.seekers.value,
            distance: q.distance.value,
            kind: "radar" as const,
        }),
    },
);

export const tentaclesQuestionSchema = z.codec(
    baseSchema.extend({
        seekers: latLonSchema,
        distance: z.number().min(0),
        candidates: featureCollectionSchema(pointSchema, propsWithId),
        candidatesName: z.string(),
        kind: z.literal("tentacles"),
    }),
    z.instanceof(TentaclesQuestion),
    {
        decode: (params) => new TentaclesQuestion(params),
        encode: (q) => ({
            ...encodeQuestionBase(q),
            seekers: q.seekers.value,
            distance: q.distance.value,
            candidates: q.candidates.value,
            candidatesName: q.candidatesName.value,
            kind: "tentacles" as const,
        }),
    },
);

export const thermometerQuestionSchema = z.codec(
    baseSchema.extend({
        seekers: latLonSchema,
        distance: z.number().min(0),
        azimuth: z.number(),
        kind: z.literal("thermometer"),
    }),
    z.instanceof(ThermometerQuestion),
    {
        decode: (params) => new ThermometerQuestion(params),
        encode: (q) => ({
            ...encodeQuestionBase(q),
            seekers: q.seekers.value,
            distance: q.distance.value,
            azimuth: q.azimuth.value,
            kind: "thermometer" as const,
        }),
    },
);

export const questionSchema = z.discriminatedUnion("kind", [
    customQuestionSchema,
    matchAreaQuestionSchema,
    matchPointQuestionSchema,
    measureQuestionSchema,
    radarQuestionSchema,
    tentaclesQuestionSchema,
    thermometerQuestionSchema,
]);
