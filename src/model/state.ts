// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { atom, onSet } from "nanostores";
import { persistentJSON } from "@nanostores/persistent";
import { type Preset } from "./schema";

export const $preset = persistentJSON<Preset>("preset", {
    name: "Empty",
    stations: { type: "FeatureCollection", features: [] },
});
onSet($preset, ({ newValue }) => {
    const collator = new Intl.Collator();
    newValue.stations.features.sort((a, b) =>
        collator.compare(a.properties.name, b.properties.name),
    );
});

export const $toast = atom<{
    header: string;
    body: string;
    variant: "success" | "danger";
} | null>(null);
