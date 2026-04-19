// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { persistentBoolean, persistentJSON } from "@nanostores/persistent";
import * as turf from "@turf/turf";
import { atom, batched } from "nanostores";
import type { Variant as BootstrapVariant } from "react-bootstrap/esm/types";
import * as z from "zod";
import { arrayAtom, persistentZod, setAtom } from "./helper/store";
import * as Preset from "./model/Preset";
import * as Question from "./model/Question";

/// Toast to display in the top-left corner of the UI
export const $toast = atom<Readonly<{
    header: string;
    body?: string;
    variant: BootstrapVariant;
}> | null>(null);

export const $hidingZoneRadius = persistentJSON("hstool:hidingZoneRadius", 0.5);
export const $showHidingZones = persistentBoolean("hstool:showHidingZones", false);

export const $preset = persistentZod("hstool:preset", Preset.schema, {
    name: "Empty",
    stations: { type: "FeatureCollection", features: [] },
});

export const $stagingQuestion = persistentZod(
    "hstool:stagingQuestion",
    Question.schema.nullable(),
    null,
);

export const $questions = arrayAtom(
    persistentZod("hstool:questions", z.array(Question.schema), []),
);

export const $discardedStations = setAtom(persistentJSON("hstool:discardedStations", {}));

export const $eliminatedStations = batched(
    [$questions, $preset, $hidingZoneRadius],
    (questions, preset, hidingZoneRadius): Record<string, 1> => {
        const eliminated: Record<string, 1> = {};
        const answeredQuestions = questions.filter(
            (q) => q.kind !== "custom" && q.answer !== undefined,
        );
        for (const question of answeredQuestions) {
            const categorized = Question.categorize(question, preset.stations, hidingZoneRadius);
            for (const station of categorized.features) {
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

export const $defaultMakerLocation = batched(
    [$preset, $disabledStations],
    (preset, disabled): number[] => {
        const enabledStations = preset.stations.features.filter(
            (s) => !Object.hasOwn(disabled, s.properties.id),
        );
        const stations =
            enabledStations.length > 0 ? turf.featureCollection(enabledStations) : preset.stations;
        return stations.features.length > 0
            ? turf.centerOfMass(stations).geometry.coordinates
            : [0, 0];
    },
);
