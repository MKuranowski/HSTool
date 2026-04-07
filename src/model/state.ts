// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { synced } from "@legendapp/state/sync";
import * as z from "zod";
import { schema as questionSchema, type SerializableQuestion } from "./question";
import type { Preset } from "./schema";

export const $toast = observable<{
    header: string;
    body: string;
    variant: "success" | "danger";
} | null>(null);

export const $preset = observable(
    synced<Preset>({
        initial: { name: "Empty", stations: { type: "FeatureCollection", features: [] } },
        persist: {
            name: "preset",
            plugin: ObservablePersistLocalStorage,
        },
    }),
);

const questionArraySchema = z.array(questionSchema);

export const $stagingQuestion = observable<SerializableQuestion | null>(
    synced({
        initial: null,
        persist: {
            name: "stagingQuestion",
            plugin: ObservablePersistLocalStorage,
            transform: {
                load: (value) => questionSchema.nullable().parse(value),
                save: (value) =>
                    questionSchema.nullable().encode(value as SerializableQuestion | null),
            },
        },
    }),
);

export const $questions = observable<SerializableQuestion[]>(
    synced({
        initial: [],
        persist: {
            name: "questions",
            plugin: ObservablePersistLocalStorage,
            transform: {
                load: (value) => questionArraySchema.parse(value),
                save: (value) => questionArraySchema.encode(value as SerializableQuestion[]),
            },
        },
    }),
);

export const $discardedStations = observable(
    synced<Record<string, 1>>({
        initial: {},
        persist: {
            name: "discardedStations",
            plugin: ObservablePersistLocalStorage,
        },
    }),
);

export const $eliminatedQuestions = observable((): Record<string, 1> => {
    const answeredQuestions = $questions.get().filter((q) => q.answer !== null);
    if (answeredQuestions.length === 0) return {};

    const set: Record<string, 1> = {};
    for (const station of $preset.stations.features.get()) {
        const isEliminated = answeredQuestions.some((q) => {
            const stationAnswer = q.categorizePoint(station.geometry.coordinates, 0);
            return stationAnswer !== null && !stationAnswer.includes(q.answer as string);
        });
        if (isEliminated) set[station.properties.id] = 1;
    }
    return set;
});

export const $disabledStations = observable(
    (): Record<string, 1> =>
        Object.assign({}, $discardedStations.get(), $eliminatedQuestions.get()),
);
