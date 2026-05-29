// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

// force the backwards-ass vite bundler to include **all** leaflet assets, not only the ones explicitly mentioned in leaflet.css
import "leaflet/dist/images/marker-icon-2x.png";
import "leaflet/dist/images/marker-shadow.png";
import { useStore } from "@nanostores/react";
import * as L from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, Pane, TileLayer } from "react-leaflet";
import * as Preset from "../model/Preset";
import { $endGameStation, $preset } from "../state";
import {
    BackgroundOverlay,
    EndGameLayer,
    QuestionMarker,
    StationLayer,
    ThermometerSecondaryMarker,
    VoronoiLayer,
} from "./MapLayer";

function getPresetBounds(p: Preset.T): L.LatLngBounds {
    return L.latLngBounds(
        p.stations.features.map((s) => s.geometry.coordinates.toReversed() as [number, number]),
    );
}

function StationsLayer() {
    const endGameStation = useStore($endGameStation);
    return endGameStation ? (
        <EndGameLayer s={endGameStation} />
    ) : (
        <>
            <Pane name="voronoiPane" style={{ zIndex: 220 }}>
                <VoronoiLayer />
            </Pane>
            <StationLayer />
        </>
    );
}

export default function GameMap() {
    // See https://leafletjs.com/reference.html#map-overlaypane for Leaflet's pane z-indices

    const map = useRef<L.Map | null>(null);

    useEffect(
        () =>
            $preset.listen((preset) => {
                if (!map.current) return;

                const bounds = getPresetBounds(preset);
                if (bounds.isValid()) map.current.flyToBounds(bounds, { duration: 0.5 });
            }),
        [map],
    );

    // Initial coordinates
    const preset = $preset.get();
    const bounds = getPresetBounds(preset);
    const center = bounds.isValid() ? bounds.getCenter() : L.latLng(0, 0);

    return (
        <MapContainer center={center} zoom={13} className="map" ref={map}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Pane name="backgroundPane" style={{ zIndex: 210 }}>
                <BackgroundOverlay />
            </Pane>
            <StationsLayer />
            <QuestionMarker />
            <ThermometerSecondaryMarker />
        </MapContainer>
    );
}
