// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";
import $ from "../state.ts";
import { presetSchema } from "../wire/preset.ts";
import { toString } from "./strings.ts";

const recordSchema = z.record(z.string(), z.string());

const builtinPresetsIndexUrl = "/HSTool/presets/index.json";
const builtinPresetsBaseUrl = builtinPresetsIndexUrl.substring(
    0,
    builtinPresetsIndexUrl.lastIndexOf("/") + 1,
);

async function fetchBuiltinPresets(): Promise<[ReadonlyMap<string, URL>, URL | null]> {
    try {
        const resp = await fetch(builtinPresetsIndexUrl);
        if (!resp.ok) throw `${resp.status.toString()} ${resp.statusText}`;

        const data = recordSchema.parse(await resp.json());

        // Try to extract the default URL
        const defaultFilename = data[""] ?? "";
        const defaultUrl = defaultFilename
            ? new URL(builtinPresetsBaseUrl + defaultFilename, window.location.href)
            : null;
        delete data[""];

        // Map every other builtin preset to a full URL
        const other = new Map(
            Object.entries(data).map(([name, filename]) => [
                name,
                new URL(builtinPresetsBaseUrl + filename, window.location.href),
            ]),
        );

        return [other, defaultUrl];
    } catch (error: unknown) {
        console.error("Failed to load builtin presets:", error);
        return [new Map(), null];
    }
}

function canLoadUserPreset(requested: string, confirmOverwrite: boolean = false): boolean {
    // Load the user preset if it's different than the current preset and
    // (!confirmOverwrite OR there are no questions OR the user consts to overwrite)
    const name = $.preset.name.peek();
    return (
        name !== requested &&
        (!confirmOverwrite ||
            $.questions.peek().length === 0 ||
            window.confirm(
                `Do you want to overwrite the current game by loading preset ${requested}?`,
            ))
    );
}

function canLoadDefaultPreset(): boolean {
    // Load the default preset if and only if the current preset is blank
    const name = $.preset.name.peek();
    const stations = $.preset.stations.peek();
    return name === "(empty)" && stations.features.length === 0;
}

export async function loadPresetFromUrl(
    name: string,
    url: URL,
    confirm: () => boolean = () => true,
): Promise<void> {
    try {
        const resp = await fetch(url);
        const preset = presetSchema.parse(await resp.json());
        if (confirm()) $.preset.update(preset);
    } catch (error: unknown) {
        const header = name ? `Failed to load preset ${name}` : "Failed to load the builtin preset";
        console.error(header, error);
        $.toast.value = {
            header,
            body: toString(error),
            variant: "danger",
        };
    }
}

export async function initializeBuiltinPresets() {
    // Fetch builtin presets from `builtinPresetsIndexUrl`
    const [other, builtin] = await fetchBuiltinPresets();
    $.builtinPresets.value = other;

    // Check if the user has requested a specific builtin preset
    const url = new URL(window.location.href);
    const requestedPreset = url.searchParams.get("preset");
    if (requestedPreset !== null) {
        url.searchParams.delete("preset");
        window.history.replaceState(window.history.state, "", url);
    }

    // Load a preset.
    const requestedPresetUrl = other.get(requestedPreset ?? "");
    if (requestedPreset !== null && requestedPresetUrl !== undefined) {
        // Load the preset the user has requested
        if (canLoadUserPreset(requestedPreset, true)) {
            await loadPresetFromUrl(requestedPreset, requestedPresetUrl);
        }
    } else if (builtin !== null) {
        // Load the default preset
        if (canLoadDefaultPreset()) {
            await loadPresetFromUrl("", builtin, canLoadDefaultPreset);
        }
    }
}
