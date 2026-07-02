// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

// force the backwards-ass vite bundler to include **all** leaflet assets, not only the ones explicitly mentioned in leaflet.css
import "leaflet/dist/images/marker-icon-2x.png";
import "leaflet/dist/images/marker-shadow.png";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { useSignalRef } from "@preact/signals-react/utils";
import type { FeatureCollection, Point } from "geojson";
import * as L from "leaflet";
import { MapContainer, Pane, TileLayer } from "react-leaflet";
import $ from "../state.ts";
import {
    BackgroundOverlay,
    EndGameLayer,
    QuestionMarker,
    StationLayer,
    ThermometerSecondaryMarker,
    VoronoiLayer,
} from "./MapLayer/index.ts";

function getMapBounds(stations: FeatureCollection<Point>): L.LatLngBounds {
    return L.latLngBounds(
        stations.features.map((s) => s.geometry.coordinates.toReversed() as [number, number]),
    );
}

function StationsLayer() {
    useSignals();
    const endGameStation = $.endGameStation.value;
    return endGameStation ? <EndGameLayer s={endGameStation} /> : (
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

    const map = useSignalRef<L.Map | null>(null);

    useSignalEffect(() => {
        const bounds = getMapBounds($.preset.stations.value);

        if (!map.current) return;
        if (bounds.isValid()) map.current.flyToBounds(bounds, { duration: 0.5 });
    });

    // Initial coordinates
    const bounds = getMapBounds($.preset.stations.peek());
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
