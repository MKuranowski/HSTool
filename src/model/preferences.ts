// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch, Signal } from "@preact/signals-react";
import z from "zod";

export const baseMapStyles = [
    "osm-carto",
    "carto-voyager",
    "carto-light",
    "carto-dark",
] as const;

export type BaseMapStyle = (typeof baseMapStyles)[number];

export const preferencesSchema = z.object({
    showHidingZones: z.boolean().optional(),
    showMapDivisions: z.boolean().optional(),
    circlePrecision: z.number().min(3).optional(),
    baseMapStyle: z.enum(baseMapStyles).optional(),
});

/**
 * Persistent user preferences and related state.
 */
export default class Preferences {
    /** Should properly-sized circles be drawn around stations? */
    readonly showHidingZones: Signal<boolean> = new Signal(false);

    /** Should Voronoi-style map divisions be shown when staging a question? */
    readonly showMapDivisions: Signal<boolean> = new Signal(true);

    /** How many points should be used to approximate any game circles? */
    readonly circlePrecision: Signal<number> = new Signal(512);

    /** Which base map should be used? */
    readonly baseMapStyle: Signal<BaseMapStyle> = new Signal(baseMapStyles[0]);

    clear(): void {
        this.update({});
    }

    update(data: z.infer<typeof preferencesSchema>): void {
        batch(() => {
            this.showHidingZones.value = data.showHidingZones ?? false;
            this.showMapDivisions.value = data.showMapDivisions ?? true;
            this.circlePrecision.value = data.circlePrecision ?? 512;
            this.baseMapStyle.value = data.baseMapStyle ?? baseMapStyles[0];
        });
    }

    toJSON(): Required<z.infer<typeof preferencesSchema>> {
        return {
            showHidingZones: this.showHidingZones.value,
            showMapDivisions: this.showMapDivisions.value,
            circlePrecision: this.circlePrecision.value,
            baseMapStyle: this.baseMapStyle.value,
        };
    }
}
