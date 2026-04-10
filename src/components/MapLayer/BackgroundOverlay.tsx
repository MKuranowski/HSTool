// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import { GeoJSON } from "react-leaflet";
import { $preset } from "../../state";

function s(x: unknown): string | undefined {
    switch (typeof x) {
        case "string":
            return x;

        case "number":
        case "bigint":
        case "boolean":
            return x.toString();

        default:
            return undefined;
    }
}

function n(x: unknown): number | undefined {
    switch (typeof x) {
        case "number":
            return x;

        case "string":
            return parseFloat(x);

        case "bigint":
            return Number(x);

        case "boolean":
            return x ? 1 : 0;

        default:
            return undefined;
    }
}

export function BackgroundOverlay() {
    const preset = useStore($preset);
    if (preset.overlay === undefined) return null;

    return (
        <GeoJSON
            data={preset.overlay}
            interactive={false}
            style={(f) => {
                if (typeof f?.properties !== "object") return {};
                const props = f.properties as Record<string, unknown>;

                return {
                    color: s(props.stroke),
                    weight: n(props["stroke-width"]),
                    opacity: n(props["stroke-opacity"]),
                    fillColor: s(props.fill),
                    fillOpacity: n(props["fill-opacity"]),
                };
            }}
        />
    );
}
