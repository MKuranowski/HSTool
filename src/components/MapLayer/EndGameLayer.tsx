// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon, Position } from "geojson";
import type { PathOptions } from "leaflet";
import { Circle, LayerGroup, Polygon as PolygonLayer, type PolygonProps } from "react-leaflet";
import { bufferBBox } from "../../helper/geo/area.ts";
import * as palette from "../../helper/palette.ts";
import type { Area } from "../../model/geo.ts";
import type { Answered, Named } from "../../model/props.ts";
import $ from "../../state.ts";
import { VoronoiExtraLayer } from "./VoronoiLayer.tsx";

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

function getPathOptions(color: string = "#3388ff"): PathOptions {
    return {
        color,
        weight: 2,
        opacity: 0.4,
        fillColor: color,
        fillOpacity: 0.2,
    };
}

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
    const circlePrecision = $.preferences.circlePrecision.value;
    const q = $.stagingQuestion.value;

    if (endGameArea === null) return null;
    if (q === null) {
        return (
            <GeoJSONPolygonLayer geometry={endGameArea.geometry} pathOptions={getPathOptions()} />
        );
    }

    const extent = bufferBBox(turf.bbox(endGameArea), 0.1);
    const answerAreas: FeatureCollection<Area, Answered & { color?: string | undefined }> | null = q
        .divideArea(extent, circlePrecision);
    if (answerAreas === null || answerAreas.features.length === 0) {
        return (
            <GeoJSONPolygonLayer geometry={endGameArea.geometry} pathOptions={getPathOptions()} />
        );
    }

    // Figure out how to color answer-areas
    const answerToColor = new Map(q.answers.value.map((a, idx) => [a, palette.getNthColor(idx)]));

    // Add appropriate color to each answer-area
    answerAreas.features.forEach((feature) => {
        feature.properties.color = answerToColor.get(feature.properties.answer.id);
    });

    return (
        <>
            <GeoJSONPolygonLayer
                geometry={endGameArea.geometry}
                pathOptions={{
                    color: "#3388ff",
                    fillOpacity: 0.1,
                    weight: 1,
                }}
            />
            <LayerGroup>
                {answerAreas.features.map((feature) => (
                    <GeoJSONPolygonLayer
                        key={feature.properties.id}
                        geometry={feature.geometry}
                        pathOptions={getPathOptions(feature.properties.color)}
                    />
                ))}
            </LayerGroup>
            <VoronoiExtraLayer key="__voronoi_extra" q={q} />
        </>
    );
}

export function EndGameLayer({ s }: { s: Feature<Point, Named> }) {
    return (
        <>
            <StationCircleLayer coords={s.geometry.coordinates} />;
            <LeftoverArea />
        </>
    );
}
