// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import * as turf from "@turf/turf";
import type { BBox, FeatureCollection, LineString, Point } from "geojson";
import * as L from "leaflet";
import { useEffect, useRef } from "react";
import { GeoJSON, LayerGroup } from "react-leaflet";
import { bufferBBox } from "../../helper/geo/area.ts";
import * as palette from "../../helper/palette.ts";
import type { Area } from "../../model/geo.ts";
import type { Answered, Identified } from "../../model/props.ts";
import { type Question } from "../../model/question/index.ts";
import $ from "../../state.ts";

function stationsExtent(
    stations: FeatureCollection<Point, Identified>,
    isDisabled: (id: string) => boolean,
    hidingZoneRadius: number,
): BBox {
    const activeStations = turf.featureCollection(
        stations.features.filter((s) => !isDisabled(s.properties.id)),
    );
    if (activeStations.features.length === 0) return [0, 0, 0, 0];
    return bufferBBox(turf.bbox(activeStations), hidingZoneRadius);
}

function VoronoiAreaLayerInner({ data }: { data: FeatureCollection<Area, { color?: string }> }) {
    const layer = useRef<L.GeoJSON<{ color?: string }, Area>>(null);

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

export function VoronoiAreaLayer({ q }: { q: Question }) {
    useSignals();

    // Compute the extent over which division needs to be calculated
    const disabledStations = $.disabledStations.value;
    const circlePrecision = $.preferences.circlePrecision.value;
    const extent = stationsExtent(
        $.preset.stations.value,
        (id) => disabledStations.has(id),
        $.preset.hidingRadius.value,
    );

    // Compute the extent division
    const collection: FeatureCollection<Area, Answered & { color?: string }> | null = q.divideArea(
        extent,
        circlePrecision,
    );
    if (collection === null) return null;

    // Figure out how to color areas
    const answerToColor = new Map(q.answers.value.map((a, idx) => [a, palette.getNthColor(idx)]));

    // Add color to collection properties
    collection.features.forEach((feature) => {
        feature.properties.color = answerToColor.get(feature.properties.answer.id);
    });

    // Draw the areas
    return <VoronoiAreaLayerInner data={collection} />;
}

function VoronoiExtraLayerInner({
    data,
}: {
    data: FeatureCollection<Point | LineString, Identified>;
}) {
    const layer = useRef<L.GeoJSON<Identified>>(null);

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
                const props = feature.properties as Identified;
                const span = document.createElement("span");
                span.innerText = props.name ?? props.id;
                return marker;
            }}
            onEachFeature={(feature, layer) => {
                const props = feature.properties as Identified;
                const span = document.createElement("span");
                span.innerText = props.name ?? props.id;
                layer.bindPopup(span);
            }}
        />
    );
}

export function VoronoiExtraLayer({ q }: { q: Question }) {
    useSignals();

    switch (q.kind) {
        case "measure":
            return <VoronoiExtraLayerInner data={q.candidates.value} />;

        case "tentacles":
            return <VoronoiExtraLayerInner data={q.candidates.value} />;

        default:
            return null;
    }
}

export default function VoronoiLayer() {
    useSignals();
    const stagingQuestion = $.stagingQuestion.value;
    if (stagingQuestion === null || stagingQuestion.kind === "custom") return null;
    return (
        <LayerGroup>
            <VoronoiAreaLayer q={stagingQuestion} />
            <VoronoiExtraLayer q={stagingQuestion} />
        </LayerGroup>
    );
}
