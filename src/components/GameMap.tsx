// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

// force the backwards-ass vite bundler to include **all** leaflet assets, not only the ones explicitly mentioned in leaflet.css
import "leaflet/dist/images/marker-icon-2x.png";
import "leaflet/dist/images/marker-shadow.png";

import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { useSignalRef } from "@preact/signals-react/utils";
import type { FeatureCollection, Point } from "geojson";
import * as L from "leaflet";
import { MapContainer, Pane } from "react-leaflet";
import $ from "../state.ts";
import BaseMapLayer from "./MapLayer/BaseMapLayer.tsx";
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
    const hiderMode = $.hiderStation.value !== null;
    const showVoronoi = $.preferences.showMapDivisions.value || endGameStation; // force voronoi in end games
    const showStations = endGameStation === null || hiderMode;

    return (
        <>
            {endGameStation && <EndGameLayer s={endGameStation} />}
            {showVoronoi && (
                <Pane name="voronoiPane" style={{ zIndex: 220 }}>
                    <VoronoiLayer />
                </Pane>
            )}
            {showStations && <StationLayer />}
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
            <BaseMapLayer />
            <Pane name="backgroundPane" style={{ zIndex: 210 }}>
                <BackgroundOverlay />
            </Pane>
            <StationsLayer />
            <QuestionMarker />
            <ThermometerSecondaryMarker />
        </MapContainer>
    );
}
