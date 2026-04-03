// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { atom, onSet, batched } from "nanostores";
import { persistentJSON } from "@nanostores/persistent";
import { type Preset } from "./schema";
import { Question } from "./question";
import * as record from "../helper/record";

export const $preset = persistentJSON<Preset>("preset", {
    name: "Empty",
    stations: { type: "FeatureCollection", features: [] },
});
onSet($preset, () => {
    $questions.set([]);
    $manuallyEliminatedQuestions.set({});
});

export const $toast = atom<{
    header: string;
    body: string;
    variant: "success" | "danger";
} | null>(null);

export const $questions = atom<Question[]>([]);
export const $manuallyEliminatedQuestions = atom<Record<string, undefined>>({});

export const $automaticallyEliminatedQuestions = batched(
    [$preset, $questions],
    (preset, questions) => {
        const answeredQuestions = questions.filter((q) => q.answer !== null);
        if (answeredQuestions.length === 0) return {};

        return record.new_(
            ...preset.stations.features
                .filter((station) =>
                    answeredQuestions.some((q) => {
                        const stationAnswer = q.categorizePoint(station.geometry.coordinates, 0);
                        return (
                            stationAnswer !== null && !stationAnswer.includes(q.answer as string)
                        );
                    }),
                )
                .map((station) => station.properties.id),
        );
    },
);

export const $eliminatedQuestions = batched(
    [$automaticallyEliminatedQuestions, $manuallyEliminatedQuestions],
    (...sets) => record.union(...sets),
);
