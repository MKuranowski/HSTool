// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch, computed, type ReadonlySignal, Signal } from "@preact/signals-react";
import * as z from "zod";
import type Preset from "./preset.ts";
import type { Question } from "./question/index.ts";

export interface TimingParams {
    preset: Preset;
    questions: ReadonlySignal<readonly Question[]>;
}

export const timingSchema = z.object({
    startTime: z.iso.datetime().optional(),
    endTime: z.iso.datetime().optional(),
    timeBonus: z.number().optional(),
});

/**
 * Timing of the game round, computed with minute precision.
 */
export default class Timing {
    /** Start time of the round - when the seekers were released. */
    readonly startTime: Signal<Date | null> = new Signal(null);

    /** End time of the round - when the hiders were found. */
    readonly endTime: Signal<Date | null> = new Signal(null);

    /** Total time bonuses - from cards and curses failed by seekers, but not from questions. */
    readonly timeBonus: Signal<number> = new Signal(0);

    /** Base hiding time (in minutes) - endTime minus startTime. */
    readonly baseTime: ReadonlySignal<number | null>;

    /**
     * Computed penalty (in minutes) for late answers and bonus for quick answers.
     *
     * `quick` is always non-negative, and `slow` is always non-positive.
     */
    readonly answerBonuses: ReadonlySignal<{ quick: number; slow: number }>;

    /** Computed final hiding time (in minutes). */
    readonly totalHidingTime: ReadonlySignal<number | null>;

    constructor(p: TimingParams) {
        this.baseTime = computed(() => {
            // Don't compute without full timing info
            if (this.startTime.value === null || this.endTime.value === null) return null;

            const start = this.startTime.value.getTime();
            const end = this.endTime.value.getTime();
            if (start > end) return null;

            const base = msToMin(end) - msToMin(start);
            return base;
        });

        this.answerBonuses = computed(() => {
            let quick = 0;
            let slow = 0;

            for (const q of p.questions.value) {
                // Ignore questions without timing info
                if (q.askedAt.value === undefined || q.answeredAt.value === undefined) continue;

                const askedAt = q.askedAt.value.t.value.getTime();
                const answeredAt = q.answeredAt.value.t.value.getTime();

                if (askedAt > answeredAt) continue;

                const answerTime = msToMin(answeredAt) - msToMin(askedAt);
                const isPhoto = q.kind === "custom" && /\bphotos?\b/im.test(q.name.value);
                const allowedTime = p.preset[isPhoto ? "photoAnswerTime" : "answerTime"].value;
                const timeDelta = allowedTime - answerTime;

                quick += Math.trunc(Math.max(0, timeDelta) * p.preset.quickAnswerMultiplier.value);
                slow += Math.min(0, timeDelta);
            }

            return { quick, slow };
        });

        this.totalHidingTime = computed(() => {
            const base = this.baseTime.value;
            if (base === null) return null;
            const { quick, slow } = this.answerBonuses.value;
            return base + this.timeBonus.value + quick + slow;
        });
    }

    clear(): void {
        this.update({});
    }

    update(data: z.infer<typeof timingSchema>): void {
        batch(() => {
            this.startTime.value = data.startTime ? new Date(data.startTime) : null;
            this.endTime.value = data.endTime ? new Date(data.endTime) : null;
            this.timeBonus.value = data.timeBonus ?? 0;
        });
    }

    toJSON(): z.infer<typeof timingSchema> {
        return {
            startTime: this.startTime.value?.toISOString(),
            endTime: this.endTime.value?.toISOString(),
            timeBonus: this.timeBonus.value,
        };
    }
}

function msToMin(ms: number): number {
    return Math.trunc(ms / 60_000);
}
