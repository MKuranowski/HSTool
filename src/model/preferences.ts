// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch, Signal } from "@preact/signals-react";
import z from "zod";

export const preferencesSchema = z.object({
    showHidingZones: z.boolean().optional(),
    circlePrecision: z.number().min(3).optional(),
});

/**
 * Persistent user preferences and related state.
 */
export default class Preferences {
    /** Should properly-sized circles be drawn around stations? */
    readonly showHidingZones: Signal<boolean> = new Signal(false);

    /** How many points should be used to approximate any game circles? */
    readonly circlePrecision: Signal<number> = new Signal(512);

    clear(): void {
        this.update({});
    }

    update(data: z.infer<typeof preferencesSchema>): void {
        batch(() => {
            this.showHidingZones.value = data.showHidingZones ?? false;
            this.circlePrecision.value = data.circlePrecision ?? 512;
        });
    }

    toJSON(): Required<z.infer<typeof preferencesSchema>> {
        return {
            showHidingZones: this.showHidingZones.value,
            circlePrecision: this.circlePrecision.value,
        };
    }
}
