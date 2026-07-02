// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed, type Signal, signal } from "@preact/signals-react";

/**
 * Timestamp describes a possibly user-provided real-life timing of an event.
 */
export default class Timestamp {
    /** Actual timestamp of an event */
    t: Signal<Date>;

    /** Whether the time was explicitly overridden by the user. */
    explicit: Signal<boolean>;

    /**
     * Creates a new Timestamp.
     *
     * When `t` is a string, it must start with "YYYY-MM-DDThh:mm", and should be a
     * RFC3339 string, or a datetime-local form value. Standard Date.parse rules apply.
     *
     * When `t` is undefined, it defaults to now (new Date()).
     */
    constructor(t?: Date | string, explicit?: boolean) {
        if (typeof t === "string") {
            if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/.test(t)) {
                throw new Error(`invalid timestamp: ${JSON.stringify(t)}`);
            }
            t = new Date(t);
        }

        this.t = signal(t ?? new Date());
        this.explicit = signal(!!explicit);
    }

    /**
     * A "YYYY-MM-DDThh:mm" string to be used in a datetime-local form entry.
     */
    formValue = computed(() => dateToFormValue(this.t.value));

    /**
     * Updates this timestamp to point to now.
     *
     * If the explicit flag is set, the force extra parameter needs to be provided
     * for the timestamp to be updated.
     */
    update({ force = false }: { force?: boolean | undefined } = {}): void {
        if (force || !this.explicit.value) {
            this.t.value = new Date();
        }
    }
}

/**
 * Converts a Date instance into a "YYYY-MM-DDThh:mm" string to be ued in a
 * datetime-local form entry.
 */
export function dateToFormValue(date: Date): string {
    const Y = date.getFullYear().toFixed(0).padStart(4, "0");
    const M = (date.getMonth() + 1).toFixed(0).padStart(2, "0");
    const D = date.getDate().toFixed(0).padStart(2, "0");
    const h = date.getHours().toFixed(0).padStart(2, "0");
    const m = date.getMinutes().toFixed(0).padStart(2, "0");
    return `${Y}-${M}-${D}T${h}:${m}`;
}
