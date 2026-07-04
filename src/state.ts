// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch, computed, effect, type ReadonlySignal, Signal } from "@preact/signals-react";
import type { Feature, Point } from "geojson";
import z from "zod";
import { hasAnswer } from "./helper/answer.ts";
import { ArraySignal, MapSignal, SetSignal } from "./helper/signal.ts";
import { toString } from "./helper/strings.ts";
import Preferences, { preferencesSchema } from "./model/preferences.ts";
import Preset from "./model/preset.ts";
import type { Named } from "./model/props.ts";
import { type Question } from "./model/question/index.ts";
import Timing, { timingSchema } from "./model/timing.ts";
import { featureSchema, pointSchema, propsWithName } from "./wire/geojson.ts";
import { presetSchema } from "./wire/preset.ts";
import { questionSchema } from "./wire/questions.ts";

export interface Toast {
    header: string;
    body?: string | undefined;
    variant: "primary" | "success" | "warning" | "danger";
}

export class State {
    /** Popover toast to display in the top-left corner. */
    readonly toast: Signal<Toast | null> = new Signal(null);

    /** Current game preset. */
    readonly preset = new Preset();

    /** Builtin presets - a map from their names to URLs. */
    readonly builtinPresets = new MapSignal<string, URL>();

    /** Question currently tried-out (staged) by the user. */
    readonly stagingQuestion: Signal<Question | null> = new Signal(null);

    /** List of all committed questions. */
    readonly questions: ArraySignal<Question> = new ArraySignal();

    /** Set of all stations manually discarded by the user. */
    readonly discardedStations: SetSignal<string> = new SetSignal();

    /** Set of all stations eliminated by committed and answered questions. */
    readonly eliminatedStations: ReadonlySignal<ReadonlySet<string>> = computed(() => {
        const eliminated = new Set<string>();

        for (const q of this.questions.value) {
            // Ignore questions without answers
            if (q.answers.value.length === 0 || q.answer.value === undefined) continue;

            // Check if this question eliminates any stations
            for (const s of this.preset.stations.value.features) {
                // No need to eliminate an already-eliminated station
                if (eliminated.has(s.properties.id)) continue;

                // Get the possible answers for this station
                const a = q.categorize(s, this.preset.hidingRadius.value);

                // If the station can't have this questions answer - eliminate it
                if (!hasAnswer(a, q.answer.value)) {
                    eliminated.add(s.properties.id);
                }
            }
        }

        return eliminated;
    });

    /**
     * Set of all stations out-of-play - [discarded]{@link discardedStations}
     * or [eliminated]{@link eliminatedStations}
     */
    readonly disabledStations: ReadonlySignal<ReadonlySet<string>> = computed(() => {
        const union = new Set<string>();
        this.discardedStations.value.forEach((s) => union.add(s));
        this.eliminatedStations.value.forEach((s) => union.add(s));
        return union;
    });

    /** Station used for the (presumed) end-game. */
    readonly endGameStation = new Signal<Feature<Point, Named> | null>(null);

    /**
     * Switch the tool to aid in hiding, not seeking.
     *
     * Instead of interrogating this value, components should check {@link hiderStation}
     * end enable hiding mode based on that.
     *
     * This is similar to end-game mode, except that:
     * - all other station pins are still shown,
     * - possible answers are restricted to that of {@link endGameStation},
     * - there's an extra "answer-based-on-GPS" button.
     */
    readonly hiderMode = new Signal<boolean>(false);

    /** {@link endGameStation} when in {@link hiderMode}, null otherwise.
     *
     * This should be used as the condition for enabling hider mode,
     * to avoid a pathological case of `hiderMode && !endGameStation`.
     */
    readonly hiderStation: ReadonlySignal<Feature<Point, Named> | null> = computed(() => {
        return this.hiderMode.value ? this.endGameStation.value : null;
    });

    /** Game time computation. */
    readonly timing: Timing = new Timing({ preset: this.preset, questions: this.questions });

    /** User preferences. */
    readonly preferences: Preferences = new Preferences();

    constructor({ persist }: { persist?: boolean | undefined } = {}) {
        persist ??= typeof window !== "undefined"; // enable persistence by default in the browser
        if (persist) this.#applyPersistence();
    }

    #applyPersistence(): void {
        persistObject<z.infer<typeof presetSchema>>("preset", this.preset, presetSchema); // why the generic is needed **only** here?
        persistSignal("stagingQuestion", this.stagingQuestion, questionSchema.nullable());
        persistSignal("questions", this.questions, questionSchema.array().readonly());
        persistSignal("discardedStations", this.discardedStations, stringSetSchema);
        persistSignal("endGameStation", this.endGameStation, stationSchema.nullable());
        persistSignal("hiderMode", this.hiderMode, z.boolean());
        persistObject("timing", this.timing, timingSchema);
        persistObject("preferences", this.preferences, preferencesSchema);
    }

    /**
     * Clears any state related to an actual hide and seek game round,
     * preserving the preset and user preferences.
     */
    clearGame(): void {
        batch(() => {
            this.stagingQuestion.value = null;
            this.questions.value = [];
            this.discardedStations.clear();
            this.endGameStation.value = null;
            this.hiderMode.value = false;
            this.timing.clear();
        });
    }
}

/**
 * Ensures a plain object is persisted. All mutable properties of object must be signals.
 *
 * Its value is revived from localStorage with `object.update(schema.decode(...))`, if there's something
 * stored. An effect is attached to trigger storage of the object on any change.
 *
 * The element returned `object.toJSON()` is validated with `schema`, to ensure it can be
 * recovered later on without throwing an error.
 *
 * This allows singletons to be persisted without having to wrap them in a signal.
 */
function persistObject<Encoding extends JSONValue>(
    name: string,
    object: { update(data: Encoding): void; toJSON(): Encoding },
    schema: z.ZodType<Encoding, Encoding>,
): void {
    const key = "hstool:" + name;
    const codec = jsonCodec(schema);

    const stored = localStorage.getItem(key);
    if (stored !== null) {
        object.update(codec.decode(stored));
    }

    effect(() => {
        localStorage.setItem(key, codec.encode(object.toJSON()));
    });
}

/**
 * Ensures a signal is persisted, via a codec encoding the item into something JSON-serializable.
 * The actual persisted value is then a JSON string representing Encoding.
 *
 * Any value already stored in localStorage will be assigned to the signal's value.
 * An effect is attached to the signal to ensure its value is persisted on every change.
 */
function persistSignal<T, Encoding extends JSONValue>(
    name: string,
    signal: Signal<T>,
    schema: z.ZodType<T, Encoding>,
): void {
    const key = "hstool:" + name;
    const codec = jsonCodec(schema);

    const stored = localStorage.getItem(key);
    if (stored !== null) {
        signal.value = codec.decode(stored);
    }

    effect(() => {
        localStorage.setItem(key, codec.encode(signal.value));
    });
}

/**
 * Wraps a zod schema into a codec which serializes the schema into a JSON string.
 */
export function jsonCodec<T extends z.ZodType>(schema: T) {
    return z.codec(z.string(), schema, {
        decode: (jsonString, ctx) => {
            try {
                return JSON.parse(jsonString);
            } catch (err) {
                ctx.issues.push({
                    code: "invalid_format",
                    format: "json",
                    input: jsonString,
                    message: toString(err),
                });
            }
        },
        encode: (value) => JSON.stringify(value),
    });
}

const stringSetSchema = z.codec(z.array(z.string()), z.set(z.string()), {
    decode: (arr) => new Set(arr),
    encode: (set) => [...set],
});

const stationSchema = featureSchema(pointSchema, propsWithName);

type JSONValue =
    | string
    | number
    | boolean
    | null
    | { readonly [key: string]: JSONValue }
    | readonly JSONValue[];

/** Global state of the application. */
export const $ = new State();
export default $;
