// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { type Question } from "../model/question/index.ts";
import $ from "../state.ts";
import { questionSchema } from "../wire/questions.ts";

export interface QuestionMessageOptions {
    separator?: string | undefined;
    prefix?: string | undefined;
    suffix?: string | undefined;
}

export function serializeQuestion(q: Question): string {
    // Dump the question to JSON, but remove the "candidates" collection.
    // It's too large to fit on most messaging platforms, and we can easily recover it.
    const data: object = questionSchema.encode(q);
    if ("candidates" in data) delete data["candidates"];
    return JSON.stringify(data);
}

export function deserializeQuestion(data: string): Question {
    const obj = JSON.parse(data);

    // Try to recover candidates
    if (
        typeof obj === "object" && !Array.isArray(obj) && obj !== null && "candidatesName" in obj &&
        !("candidates" in obj)
    ) {
        obj.candidates = $.preset.findCandidateSet(obj.candidatesName);
    }

    return questionSchema.parse(obj);
}

export function questionToHumanText(q: Question): string {
    switch (q.kind) {
        case "custom": {
            const text = q.name.value;

            // Try to extract some common formats, namely "Type: thing".
            // Currently, only photos are recognized that way.
            const photoMatch = text.match(/^photo:?\s+(.+)?$/i);
            if (photoMatch !== null) {
                return `Send me a photo of ${photoMatch[1]}.`;
            }

            return text;
        }

        case "match-area":
        case "match-point": {
            const candidates = q.candidatesName.value;
            const match = q.seekersMatch.value;
            const matchName = match?.properties.name ?? match?.properties.id ?? "";
            return `Is your nearest ${candidates} the same as mine? Mine is ${matchName}.`;
        }

        case "measure": {
            const candidates = q.candidatesName.value;
            const distance = q.seekerDistance.value;
            const precision = distance >= 10 ? 1 : 3;
            return `Compared to me, are you closer to or further from ${candidates}? ` +
                `I'm ${distance.toFixed(precision)} km away.`;
        }

        case "radar": {
            const distance = q.distance.value;
            const [lon, lat] = q.seekers.value;
            const location = `${lat.toFixed(6)} ${lon.toFixed(6)}`;
            return `Are you within ${distance} km of me? I'm at ${location}.`;
        }

        case "tentacles": {
            const distance = q.distance.value;
            const candidates = q.candidatesName.value;
            const [lon, lat] = q.seekers.value;
            const location = `${lat.toFixed(6)} ${lon.toFixed(6)}`;
            return `Within ${distance} km of me, which ${candidates} are you nearest to? ` +
                `(You must also be within ${distance} km.) I'm at ${location}.`;
        }

        case "thermometer": {
            const distance = q.distance.value;
            const [startLon, startLat] = q.seekers.value;
            const start = `${startLat.toFixed(6)} ${startLon.toFixed(6)}`;
            const [endLon, endLat] = q.endLocation.value;
            const end = `${endLat.toFixed(6)} ${endLon.toFixed(6)}`;
            return `After traveling ${distance} km, am I hotter or colder? I started at ${start}, now I'm at ${end}.`;
        }
    }
}

export function questionToMessage(
    q: Question,
    { separator = "\n\n", prefix = "||`", suffix = "`||" }: QuestionMessageOptions = {},
): string {
    const text = questionToHumanText(q);
    const data = serializeQuestion(q);
    return [text, separator, prefix, data, suffix].join("");
}

export function questionFromMessage(
    msg: string,
    { prefix = "||`", suffix = "`||" }: Pick<QuestionMessageOptions, "prefix" | "suffix"> = {},
) {
    const start = msg.indexOf(prefix);
    if (start < 0) throw `Invalid message - data marker ${JSON.stringify(prefix)} is missing`;

    const end = msg.lastIndexOf(suffix);
    if (end < 0) throw `Invalid message - data marker ${JSON.stringify(suffix)} is missing`;

    const data = msg.substring(start + prefix.length, end);
    return deserializeQuestion(data);
}
