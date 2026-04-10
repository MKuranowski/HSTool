// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { MapContainer, Pane, TileLayer } from "react-leaflet";
import { QuestionMarker, StationLayer, ThermometerSecondaryMarker } from "./MapLayer";
import { BackgroundOverlay } from "./MapLayer/BackgroundOverlay";

export default function GameMap() {
    // See https://leafletjs.com/reference.html#map-overlaypane for Leaflet's pane z-indices

    return (
        <MapContainer center={[52.2, 21.0]} zoom={13} className="map">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Pane name="backgroundPane" style={{ zIndex: 210 }}>
                <BackgroundOverlay />
            </Pane>
            <Pane name="stationsPane" style={{ zIndex: 350 }}>
                <StationLayer />
            </Pane>
            <QuestionMarker />
            <ThermometerSecondaryMarker />
        </MapContainer>
    );
}
