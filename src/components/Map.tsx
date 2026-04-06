// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useValue } from "@legendapp/state/react";
import * as L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { PropertiesWithName } from "../model/schema";
import { $disabledStations, $preset } from "../model/state";

let stationsLayer: L.Layer | null = null;

export default function Map() {
    const [map, setMap] = useState<L.Map | null>(null);
    const stations = useValue($preset.stations);
    const disabledStations = useValue($disabledStations);

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

        const newLayer = L.geoJSON(stations, {
            filter(f) {
                const id = (f.properties as PropertiesWithName).id;
                return !Object.hasOwn(disabledStations, id);
            },

            pointToLayer(f, latlng) {
                const m = L.circleMarker(latlng, { radius: 5 });
                const name = (f.properties as PropertiesWithName).name;
                m.bindPopup(name);
                return m;
            },
        });

        if (stationsLayer) stationsLayer.removeFrom(map);
        stationsLayer = newLayer.addTo(map);
    }, [map, stations, disabledStations]);

    return displayMap;
}
