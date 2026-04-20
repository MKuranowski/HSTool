// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";

export const schema = z.object({
    t: z.iso.datetime(),
    explicit: z.boolean().optional().default(false),
});

export type T = z.infer<typeof schema>;

export function now({ explicit = true }: { explicit?: boolean } = {}): T {
    return { t: new Date().toISOString(), explicit };
}

export function toFormValue(t: T): string {
    const date = new Date(t.t);
    const Y = date.getFullYear().toFixed(0).padStart(4, "0");
    const M = (date.getMonth() + 1).toFixed(0).padStart(2, "0");
    const D = date.getDate().toFixed(0).padStart(2, "0");
    const h = date.getHours().toFixed(0).padStart(2, "0");
    const m = date.getMinutes().toFixed(0).padStart(2, "0");
    return `${Y}-${M}-${D}T${h}:${m}`;
}

export function fromFormValue(value: string, { explicit = true }: { explicit?: boolean } = {}): T {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/.test(value)) {
        throw new TypeError(`Invalid datetime-local input value: ${JSON.stringify(value)}`);
    }

    return {
        t: new Date(value).toISOString(),
        explicit,
    };
}

export function updated(t: T | undefined, { force = false }: { force?: boolean } = {}): T {
    if (t?.explicit && !force) return t;

    return {
        t: new Date().toISOString(),
        explicit: t?.explicit ?? false,
    };
}
