// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import * as L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import * as record from "../helper/record";
import type { PropertiesWithName } from "../model/schema";
import { $eliminatedQuestions, $preset } from "../model/state";

let stationsLayer: L.Layer | null = null;

export default function Map() {
    const [map, setMap] = useState<L.Map | null>(null);
    const preset = useStore($preset);
    const eliminatedStations = useStore($eliminatedQuestions);

    const displayMap = useMemo(
        () => (
            <MapContainer center={[52.2, 21.0]} zoom={13} className="map" ref={setMap}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>
        ),
        [],
    );

    useEffect(() => {
        if (!map) return;

        const newLayer = L.geoJSON(preset.stations, {
            filter(f) {
                return !record.contains(
                    eliminatedStations,
                    (f.properties as PropertiesWithName).id,
                );
            },

            pointToLayer(f, latlng) {
                const m = L.circleMarker(latlng, { radius: 5 });
                m.bindPopup((f.properties as PropertiesWithName).name);
                return m;
            },
        });

        if (stationsLayer) stationsLayer.removeFrom(map);
        stationsLayer = newLayer.addTo(map);
    }, [eliminatedStations, map, preset]);

    return displayMap;
}
