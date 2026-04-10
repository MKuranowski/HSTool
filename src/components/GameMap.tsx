// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { Feature, Point } from "geojson";
import * as L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import * as palette from "../helper/pallete";
import type { PropertiesWithName } from "../model/Geo";
import * as Question from "../model/Question";
import { $disabledStations, $hidingZoneRadius, $preset, $stagingQuestion } from "../state";

let stationsLayer: L.Layer | null = null;

function rot(x: number, y: number, angleRadians: number): [number, number] {
    const sin = Math.sin(angleRadians);
    const cos = Math.cos(angleRadians);
    return [cos * x - sin * y, sin * x + cos * y];
}

function segmentedCircle(
    points: [number, number][],
    colors: string[],
    radius: number = 1,
    opacity: number = 1,
): SVGPathElement[] {
    if (points.length !== colors.length)
        throw new Error("segmentedCircle: points and color must be the same length");

    return points.map((pt, idx) => {
        const [x1, y1] = pt;
        const [x2, y2] = points[(idx + 1) % points.length];
        const color = colors[idx];

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        const path = `M 0 0 ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;

        const elem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        elem.setAttributeNS(null, "d", path);
        elem.setAttributeNS(null, "fill", color);
        elem.setAttributeNS(null, "fill-opacity", opacity.toString());
        return elem;
    });
}

function fullCircle(color: string, radius: number = 1, opacity: number = 1): SVGCircleElement {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttributeNS(null, "cx", "1");
    circle.setAttributeNS(null, "cy", "1");
    circle.setAttributeNS(null, "r", radius.toString());
    circle.setAttributeNS(null, "fill", color);
    circle.setAttributeNS(null, "fill-opacity", opacity.toString());
    return circle;
}

function _stationIcon(colors?: string[]): SVGSVGElement {
    const size = 16;
    const innerRadius = 0.7;
    const innerOpacity = 0.7;
    const outerRadius = 1;
    const outerOpacity = 0.1;

    colors = colors === undefined || colors.length === 0 ? [palette.primary] : colors;

    const root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    root.setAttributeNS(null, "width", size.toString());
    root.setAttributeNS(null, "height", size.toString());
    root.setAttributeNS(null, "viewBox", "0 0 2 2");

    // Special case for single color. Angles more than 180° require different
    // elliptical curve parameters (large-arc-flag=1), while the code below
    // sets it to zero.
    if (colors.length === 1) {
        root.append(
            fullCircle(colors[0], outerRadius, outerOpacity),
            fullCircle(colors[0], innerRadius, innerOpacity),
        );
        return root;
    }

    const angles = colors.map((_, idx) => (2 * idx * Math.PI) / colors.length);
    const innerPoints = angles.map((a) => rot(0, -innerRadius, a));
    const outerPoints = angles.map((a) => rot(0, -outerRadius, a));

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttributeNS(null, "transform", "translate(1,1)");
    root.append(g);

    g.append(...segmentedCircle(outerPoints, colors, outerRadius, outerOpacity));
    g.append(...segmentedCircle(innerPoints, colors, innerRadius, innerOpacity));

    return root;
}

function _wrapInDiv(...elem: Node[]): HTMLDivElement {
    const d = document.createElement("div");
    d.append(...elem);
    return d;
}

const _stationIconMemo = new Map<string, SVGSVGElement>();

function stationIcon(colors?: string[]): HTMLDivElement {
    const key = colors?.join(";") ?? "";
    const cached = _stationIconMemo.get(key);
    if (cached !== undefined) return _wrapInDiv(cached.cloneNode(true));

    const icon = _stationIcon(colors);
    _stationIconMemo.set(key, icon);
    return _wrapInDiv(icon.cloneNode(true));
}

function QuestionMarker() {
    const stagingQuestion = useStore($stagingQuestion);
    const markerRef = useRef<L.Marker | null>(null);
    const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(
        () => ({
            dragend() {
                const newPos = markerRef.current?.getLatLng();
                if (newPos === undefined) return;

                const q = $stagingQuestion.get();
                if (q) {
                    $stagingQuestion.set(Question.withPosition(q, [newPos.lng, newPos.lat]));
                }
            },
        }),
        [],
    );

    // Don't display the marker without a staging question
    if (stagingQuestion === null || stagingQuestion.kind === "custom") {
        return <></>;
    }

    const position = L.latLng(stagingQuestion.seeker[1], stagingQuestion.seeker[0]);

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

export default function GameMap() {
    const [map, setMap] = useState<L.Map | null>(null);
    const preset = useStore($preset);
    const stagingQuestion = useStore($stagingQuestion);
    const disabledStations = useStore($disabledStations);
    const hidingZoneRadius = useStore($hidingZoneRadius);

    const displayMap = useMemo(
        () => (
            <MapContainer center={[52.2, 21.0]} zoom={13} className="map" ref={setMap}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <QuestionMarker />
            </MapContainer>
        ),
        [],
    );

    useEffect(() => {
        if (!map) return;
        const visibleStations = {
            type: "FeatureCollection" as const,
            features: preset.stations.features.filter(
                (s) => !Object.hasOwn(disabledStations, s.properties.id),
            ),
        };

        const annotatedStations =
            stagingQuestion !== null
                ? Question.categorize(stagingQuestion, visibleStations, hidingZoneRadius)
                : visibleStations;

        const answerToColor = new Map(
            stagingQuestion !== null
                ? Question.answers(stagingQuestion).map(
                      (a, idx) => [a, palette.getNthColor(idx)] as const,
                  )
                : [],
        );

        const newLayer = L.geoJSON(annotatedStations, {
            pointToLayer(fRaw, latlng) {
                const f = fRaw as Feature<
                    Point,
                    { id: string; name: string; possibleAnswers?: string[] }
                >;

                const colors = f.properties.possibleAnswers
                    ? f.properties.possibleAnswers.map(
                          (a) => answerToColor.get(a) ?? palette.primary,
                      )
                    : undefined;

                const icon = L.divIcon({
                    html: stationIcon(colors),
                    className: "",
                });
                const m = L.marker(latlng, { icon });
                const name = (f.properties as PropertiesWithName).name;
                m.bindPopup(name);
                return m;
            },
        });

        if (stationsLayer) stationsLayer.removeFrom(map);
        stationsLayer = newLayer.addTo(map);
    }, [map, preset, disabledStations, stagingQuestion, hidingZoneRadius]);

    return displayMap;
}
