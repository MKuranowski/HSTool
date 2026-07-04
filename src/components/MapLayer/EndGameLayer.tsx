// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Point, Polygon, Position } from "geojson";
import { Circle, Polygon as PolygonLayer, type PolygonProps } from "react-leaflet";
import { bufferBBox } from "../../helper/geo/area.ts";
import type { Named } from "../../model/props.ts";
import $ from "../../state.ts";

const $endGameArea = computed((): Feature<MultiPolygon> | null => {
    const endGameStation = $.endGameStation.value;
    if (endGameStation === null) return null;

    let area: Feature<Polygon | MultiPolygon> = turf.circle(
        endGameStation,
        $.preset.hidingRadius.value,
        { steps: $.preferences.circlePrecision.value },
    );

    const extent = bufferBBox(turf.bbox(area), 0.1);

    for (const q of $.questions.value) {
        // Ignore questions without answers or not applicable in the end game
        if (q.answer.value === undefined) continue;
        if (!q.inEndGame.value) continue;

        // Divide the extent based on answers
        const division = q.divideArea(extent);
        if (division === null) continue;

        // Union all the answer-areas which don't match with hiders' answer
        const mismatchedAreas = division.features.filter(
            (area) => area.properties.answer.id !== q.answer.value,
        );
        if (mismatchedAreas.length === 0) continue;
        const mismatchedArea = mismatchedAreas.length > 1
            ? turf.union(turf.featureCollection(mismatchedAreas))
            : mismatchedAreas[0];
        if (mismatchedArea === null) continue;

        // Chop off the hiding zone where the answer wouldn't match
        const newArea = turf.difference(turf.featureCollection([area, mismatchedArea]));
        if (newArea === null) return null;
        area = newArea;
    }

    if (area.geometry.type === "Polygon") return turf.multiPolygon([area.geometry.coordinates]);
    return area as Feature<MultiPolygon>;
});

function StationCircleLayer({ coords }: { coords: Position }) {
    useSignals();
    const hidingRadius = $.preset.hidingRadius.value;

    return (
        <Circle
            center={[coords[1], coords[0]]}
            radius={hidingRadius * 1000}
            pathOptions={{
                color: "#000000",
                dashArray: "16",
                fill: false,
            }}
        />
    );
}

function GeoJSONPolygonLayer({
    geometry,
    ...rest
}: Omit<PolygonProps, "positions"> & { geometry: Polygon | MultiPolygon }) {
    const polygonsLonLat = geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;
    const polygonsLatLon = polygonsLonLat.map((polygonLonLat) =>
        polygonLonLat.map((ringLonLat) =>
            ringLonLat.map((coords) => coords.toReversed() as [number, number])
        )
    );
    return <PolygonLayer {...rest} positions={polygonsLatLon} />;
}

function LeftoverArea() {
    useSignals();

    const endGameArea = $endGameArea.value;
    if (endGameArea === null) return null;

    const pathOptions = {
        color: "#3388ff",
        weight: 2,
        opacity: 0.8,
        fillColor: "#3388ff",
        fillOpacity: 0.2,
    };

    // Tweak visibility when staging a question
    if ($.stagingQuestion.value !== null && $.stagingQuestion.value.kind !== "custom") {
        pathOptions.fillOpacity = 0.075;
    }

    return <GeoJSONPolygonLayer geometry={endGameArea.geometry} pathOptions={pathOptions} />;
}

export function EndGameLayer({ s }: { s: Feature<Point, Named> }) {
    return (
        <>
            <StationCircleLayer coords={s.geometry.coordinates} />;
            <LeftoverArea />
        </>
    );
}
