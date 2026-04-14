// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import * as turf from "@turf/turf";
import type { BBox, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import * as L from "leaflet";
import { useEffect, useRef } from "react";
import { GeoJSON } from "react-leaflet";
import { LayerGroup } from "react-leaflet";
import { bufferBBox } from "../../helper/geo";
import * as palette from "../../helper/pallete";
import type { PropertiesWithAnswer, PropertiesWithID } from "../../model/Geo";
import * as Question from "../../model/Question";
import { $disabledStations, $hidingZoneRadius, $preset, $stagingQuestion } from "../../state";

function stationsExtent(
    stations: FeatureCollection<Point, PropertiesWithID>,
    isDisabled: (id: string) => boolean,
    hidingZoneRadius: number,
): BBox {
    const activeStations = turf.featureCollection(
        stations.features.filter((s) => !isDisabled(s.properties.id)),
    );
    if (activeStations.features.length === 0) return [0, 0, 0, 0];
    return bufferBBox(turf.bbox(activeStations), hidingZoneRadius);
}

function VoronoiAreaLayerInner({
    data,
}: {
    data: FeatureCollection<Polygon | MultiPolygon, { color?: string }>;
}) {
    const layer = useRef<L.GeoJSON<{ color?: string }, Polygon | MultiPolygon>>(null);

    useEffect(() => {
        if (layer.current) {
            layer.current.clearLayers().addData(data);
        }
    }, [data]);

    return (
        <GeoJSON
            ref={layer}
            data={data}
            style={(area) => {
                const props = area?.properties as { color?: string };
                const color = props.color ?? palette.primary;
                return {
                    color,
                    weight: 2,
                    opacity: 0.4,
                    fillColor: color,
                    fillOpacity: 0.2,
                };
            }}
        />
    );
}

export function VoronoiAreaLayer({ q }: { q: Question.T }) {
    // Compute the extent over which division needs to be calculated
    const preset = useStore($preset);
    const disabledStations = useStore($disabledStations);
    const hidingZoneRadius = useStore($hidingZoneRadius);
    const extent = stationsExtent(
        preset.stations,
        (id) => Object.hasOwn(disabledStations, id),
        hidingZoneRadius,
    );

    // Compute the extent division
    const collection: FeatureCollection<
        Polygon | MultiPolygon,
        PropertiesWithAnswer & { color?: string }
    > | null = Question.divideArea(q, extent);
    if (collection === null) return null;

    // Figure out how to color areas
    const answerToColor = new Map(
        Question.answers(q).map((a, idx) => [a, palette.getNthColor(idx)]),
    );

    // Add color to collection properties
    collection.features.forEach((feature) => {
        feature.properties.color = answerToColor.get(feature.properties.answer);
    });

    // Draw the areas
    return <VoronoiAreaLayerInner data={collection} />;
}

function VoronoiExtraLayerInner({
    data,
}: {
    data: FeatureCollection<Point | LineString, PropertiesWithID>;
}) {
    const layer = useRef<L.GeoJSON<PropertiesWithAnswer, Polygon | MultiPolygon>>(null);

    useEffect(() => {
        if (layer.current) {
            layer.current.clearLayers().addData(data);
        }
    }, [data]);

    return (
        <GeoJSON
            ref={layer}
            data={data}
            style={{
                color: "#000000",
                weight: 2,
                opacity: 0.6,
            }}
            pointToLayer={(feature, latLng) => {
                const marker = L.circleMarker(latLng, {
                    radius: 4,
                    stroke: false,
                    fillColor: "#000000",
                    fillOpacity: 0.6,
                });
                const props = feature.properties as PropertiesWithID;
                const span = document.createElement("span");
                span.innerText = props.name ?? props.id;
                return marker;
            }}
            onEachFeature={(feature, layer) => {
                const props = feature.properties as PropertiesWithID;
                const span = document.createElement("span");
                span.innerText = props.name ?? props.id;
                layer.bindPopup(span);
            }}
        />
    );
}

export function VoronoiExtraLayer({ q }: { q: Question.T }) {
    switch (q.kind) {
        case "measure":
            return <VoronoiExtraLayerInner data={q.candidates} />;

        case "tentacles":
            return <VoronoiExtraLayerInner data={q.candidates} />;

        default:
            return null;
    }
}

export default function VoronoiLayer() {
    const stagingQuestion = useStore($stagingQuestion);
    if (stagingQuestion === null || stagingQuestion.kind === "custom") return null;
    return (
        <LayerGroup>
            <VoronoiAreaLayer q={stagingQuestion} />
            <VoronoiExtraLayer q={stagingQuestion} />
        </LayerGroup>
    );
}
