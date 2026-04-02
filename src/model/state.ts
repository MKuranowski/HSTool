// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { atom } from "nanostores";
import { persistentJSON } from "@nanostores/persistent";
import { type Preset } from "./schema";

export const $preset = persistentJSON<Preset>("preset", {
    name: "Empty",
    stations: { type: "FeatureCollection", features: [] },
});

export const $toast = atom<{
    header: string;
    body: string;
    variant: "success" | "danger";
} | null>(null);
