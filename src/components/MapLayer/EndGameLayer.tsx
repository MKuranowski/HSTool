// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon, Position } from "geojson";
import type { PathOptions } from "leaflet";
import { batched } from "nanostores";
import { Circle, LayerGroup, Polygon as PolygonLayer, type PolygonProps } from "react-leaflet";
import { bufferBBox } from "../../helper/geo";
import * as palette from "../../helper/palette";
import type { PropertiesWithAnswer, PropertiesWithName } from "../../model/Geo";
import * as Question from "../../model/Question";
import {
    $circlePrecision,
    $endGameStation,
    $hidingZoneRadius,
    $questions,
    $stagingQuestion,
} from "../../state";
import { VoronoiExtraLayer } from "./VoronoiLayer";

const $endGameArea = batched(
    [$endGameStation, $hidingZoneRadius, $questions, $circlePrecision],
    (
        endGameStation,
        hidingZoneRadius,
        questions,
        circlePrecision,
    ): Feature<MultiPolygon> | null => {
        if (endGameStation === null) return null;

        let area: Feature<Polygon | MultiPolygon> = turf.circle(endGameStation, hidingZoneRadius, {
            steps: circlePrecision,
        });

        const extent = bufferBBox(turf.bbox(area), 0.1);

        for (const q of questions) {
            if (q.answer === undefined) continue;
            if (!q.inEndGame) continue;

            const division = Question.divideArea(q, extent);
            if (division === null) continue;

            const unionCandidates = division.features.filter(
                (area) => area.properties.answer !== q.answer,
            );
            if (unionCandidates.length === 0) return null;
            const questionArea =
                unionCandidates.length > 1
                    ? turf.union(turf.featureCollection(unionCandidates))
                    : unionCandidates[0];
            if (questionArea === null) return null;

            const newArea = turf.difference(turf.featureCollection([area, questionArea]));
            if (newArea === null) return null;
            area = newArea;
        }

        if (area.geometry.type === "Polygon") return turf.multiPolygon([area.geometry.coordinates]);
        return area as Feature<MultiPolygon>;
    },
);

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
    const hidingZoneRadius = useStore($hidingZoneRadius);
    return (
        <Circle
            center={[coords[1], coords[0]]}
            radius={hidingZoneRadius * 1000}
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
    const polygonsLonLat =
        geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    const polygonsLatLon = polygonsLonLat.map((polygonLonLat) =>
        polygonLonLat.map((ringLonLat) =>
            ringLonLat.map((coords) => coords.toReversed() as [number, number]),
        ),
    );
    return <PolygonLayer {...rest} positions={polygonsLatLon} />;
}

function LeftoverArea() {
    const endGameArea = useStore($endGameArea);
    const q = useStore($stagingQuestion);
    if (endGameArea === null) return null;
    if (q === null)
        return (
            <GeoJSONPolygonLayer geometry={endGameArea.geometry} pathOptions={getPathOptions()} />
        );

    const extent = bufferBBox(turf.bbox(endGameArea), 0.1);
    const collection: FeatureCollection<
        Polygon | MultiPolygon,
        PropertiesWithAnswer & { color?: string }
    > | null = Question.divideArea(q, extent);
    if (collection === null || collection.features.length === 0)
        return (
            <GeoJSONPolygonLayer geometry={endGameArea.geometry} pathOptions={getPathOptions()} />
        );

    // Figure out how to color areas
    const answerToColor = new Map(
        Question.answers(q).map((a, idx) => [a, palette.getNthColor(idx)]),
    );

    // Add color to collection properties
    collection.features.forEach((feature) => {
        feature.properties.color = answerToColor.get(feature.properties.answer);
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
                {collection.features.map((feature) => (
                    <GeoJSONPolygonLayer
                        key={feature.properties.id}
                        geometry={feature.geometry}
                        pathOptions={{
                            color: feature.properties.color ?? "",
                            weight: 2,
                            opacity: 0.4,
                            fillColor: feature.properties.color ?? "",
                            fillOpacity: 0.2,
                        }}
                    />
                ))}
            </LayerGroup>
            <VoronoiExtraLayer key="__voronoi_extra" q={q} />
        </>
    );
}

export function EndGameLayer({ s }: { s: Feature<Point, PropertiesWithName> }) {
    return (
        <>
            <StationCircleLayer coords={s.geometry.coordinates} />;
            <LeftoverArea />
        </>
    );
}
