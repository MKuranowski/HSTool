// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { persistentBoolean, persistentJSON } from "@nanostores/persistent";
import * as turf from "@turf/turf";
import { atom, batched, effect, onMount, task } from "nanostores";
import type { Variant as BootstrapVariant } from "react-bootstrap/esm/types";
import * as z from "zod";
import builtinPresetsIndexUrl from "/presets/index.json?url";
import { hasAnswer } from "./helper/answer";
import { arrayAtom, persistentZod, setAtom } from "./helper/store";
import * as Preset from "./model/Preset";
import * as Question from "./model/Question";

/// Toast to display in the top-left corner of the UI
export const $toast = atom<Readonly<{
    header: string;
    body?: string;
    variant: BootstrapVariant;
}> | null>(null);

export const $answerTime = persistentJSON("hstool:answerTime", 5);
export const $photoAnswerTime = persistentJSON("hstool:photoAnswerTime", 10);
export const $quickAnswerMultiplier = persistentJSON("hstool:quickAnswerMultiplier", 0.0);
export const $hidingZoneRadius = persistentJSON("hstool:hidingZoneRadius", 0.5);
export const $showHidingZones = persistentBoolean("hstool:showHidingZones", false);

export const $builtinPresets = atom<Record<string, string>>({});
export const $preset = persistentZod("hstool:preset", Preset.schema, {
    name: "(none)",
    hiding_radius: 0.5,
    stations: { type: "FeatureCollection", features: [] },
});

const canLoadBuiltinPreset = (forced: string): boolean => {
    const p = $preset.get();
    return (
        (p.stations.features.length === 0 && p.name === "(none)") ||
        (forced !== "" && forced !== p.name)
    );
};

onMount($builtinPresets, () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    task(async () => {
        const indexResp = await fetch(builtinPresetsIndexUrl);
        if (!indexResp.ok) return;
        const index = (await indexResp.json()) as Record<string, string>;
        delete index[""];
        $builtinPresets.set(index);
    });
});

onMount($preset, () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    task(async () => {
        // Check if a specific preset was requested
        const url = new URL(window.location.href);
        const forcePreset = url.searchParams.get("preset") ?? "";
        if (forcePreset !== "") {
            url.searchParams.delete("preset");
            window.history.replaceState(window.history.state, "", url.toString());
        }

        // Don't overwrite any existing presets
        if (!canLoadBuiltinPreset(forcePreset)) return;

        // Fetch the list of builtin presets
        const indexResp = await fetch(builtinPresetsIndexUrl);
        if (!indexResp.ok) return;
        const index = (await indexResp.json()) as Record<string, string>;

        // Fetch the specified preset
        const defaultFilename = index[forcePreset] ?? "";
        if (!defaultFilename) return;

        const defaultUrl =
            builtinPresetsIndexUrl.substring(0, builtinPresetsIndexUrl.lastIndexOf("/") + 1) +
            defaultFilename;
        const defaultResp = await fetch(defaultUrl);
        if (!defaultResp.ok) return;
        const default_ = Preset.schema.parse(await defaultResp.json());

        // Check again - maybe someone pasted a preset in-between
        if (!canLoadBuiltinPreset(forcePreset)) return;
        clearGameState();
        $preset.set(default_);
    });
});

effect($preset, (p) => {
    $hidingZoneRadius.set(p.hiding_radius);
});

export const $stagingQuestion = persistentZod(
    "hstool:stagingQuestion",
    Question.schema.nullable(),
    null,
);

export const $questions = arrayAtom(
    persistentZod("hstool:questions", z.array(Question.schema), []),
);

export const $startTime = persistentZod("hstool:startTime", z.iso.datetime().nullable(), null);
export const $endTime = persistentZod("hstool:endTime", z.iso.datetime().nullable(), null);
export const $timeBonus = persistentJSON("hstool:timeBonus", 0);

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
                if (!hasAnswer(station.properties.possibleAnswers, question.answer as string)) {
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

export function clearGameState() {
    $stagingQuestion.set(null);
    $questions.set([]);
    $startTime.set(null);
    $endTime.set(null);
    $timeBonus.set(0);
    $discardedStations.set({});
}
