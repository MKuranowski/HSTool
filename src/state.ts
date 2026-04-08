// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { persistentJSON } from "@nanostores/persistent";
import { atom, batched } from "nanostores";
import type { Variant as BootstrapVariant } from "react-bootstrap/esm/types";
import * as z from "zod";
import { arrayAtom, persistentZod, setAtom } from "./helper/store";
import * as Preset from "./model/Preset";
import * as Question from "./model/Question";

/// Toast to display in the top-left corner of the UI
export const $toast = atom<Readonly<{
    header: string;
    body: string;
    variant: BootstrapVariant;
}> | null>(null);

export const $preset = persistentZod("preset", Preset.schema, {
    name: "Empty",
    stations: { type: "FeatureCollection", features: [] },
});

export const $stagingQuestion = persistentZod("stagingQuestion", Question.schema.nullable(), null);

export const $questions = arrayAtom(persistentZod("questions", z.array(Question.schema), []));

export const $discardedStations = setAtom(persistentJSON("discardedStations", {}));

export const $eliminatedStations = batched(
    [$questions, $preset],
    (questions, preset): Record<string, 1> => {
        const eliminated: Record<string, 1> = {};
        for (const question of questions.filter((q) => q.answer !== undefined)) {
            for (const station of Question.categorize(question, preset.stations, 0).features) {
                if (!station.properties.possibleAnswers.includes(question.answer as string)) {
                    eliminated[station.properties.id] = 1;
                }
            }
        }
        return eliminated;
    },
);

export const $disabledStations = batched(
    [$discardedStations, $eliminatedStations],
    (discarded, eliminated) => Object.assign({}, discarded, eliminated),
);
