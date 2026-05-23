// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { FeatureCollection, Point } from "geojson";
import * as L from "leaflet";
import { Circle, LayerGroup, Marker, Popup } from "react-leaflet";
import * as palette from "../../helper/palette";
import type { PropertiesWithName } from "../../model/Geo";
import * as Question from "../../model/Question";
import {
    $disabledStations,
    $hidingZoneRadius,
    $preset,
    $showHidingZones,
    $stagingQuestion,
} from "../../state";

const MARKER_SIZE = 16;

interface AnnotatedStationProperties extends PropertiesWithName {
    possibleAnswers?: string[] | undefined;
}

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
        elem.setAttribute("d", path);
        elem.setAttribute("fill", color);
        elem.setAttribute("fill-opacity", opacity.toString());
        return elem;
    });
}

function fullCircle(color: string, radius: number = 1, opacity: number = 1): SVGCircleElement {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "1");
    circle.setAttribute("cy", "1");
    circle.setAttribute("r", radius.toString());
    circle.setAttribute("fill", color);
    circle.setAttribute("fill-opacity", opacity.toString());
    return circle;
}

function _stationIcon(colors?: string[]): SVGSVGElement {
    const innerRadius = 0.7;
    const innerOpacity = 0.7;
    const outerRadius = 1;
    const outerOpacity = 0.1;

    colors = colors === undefined || colors.length === 0 ? [palette.primary] : colors;

    const root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    root.setAttribute("width", MARKER_SIZE.toString());
    root.setAttribute("height", MARKER_SIZE.toString());
    root.setAttribute("viewBox", "0 0 2 2");
    root.setAttribute("style", "display: block;");

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
    g.setAttribute("transform", "translate(1,1)");
    root.append(g);

    g.append(...segmentedCircle(outerPoints, colors, outerRadius, outerOpacity));
    g.append(...segmentedCircle(innerPoints, colors, innerRadius, innerOpacity));

    return root;
}

const _stationIconMemo = new Map<string, SVGSVGElement>();

function stationIcon(colors?: string[]): SVGSVGElement {
    const key = colors?.join(";") ?? "";
    const cached = _stationIconMemo.get(key);
    if (cached !== undefined) return cached.cloneNode(true) as SVGSVGElement;

    const icon = _stationIcon(colors);
    _stationIconMemo.set(key, icon);
    return icon;
}

function StationPopup({
    properties,
    answerToColor,
}: {
    properties: AnnotatedStationProperties;
    answerToColor: Map<string, string>;
}) {
    // eslint-disable-next-line react-x/no-missing-key
    const children = [<b>{properties.name}</b>, <br />];

    if (properties.possibleAnswers) {
        children.push(
            <>Possible answers:</>,
            <ul>
                {properties.possibleAnswers.map((a) => (
                    <li key={a} color={answerToColor.get(a)}>
                        {a}
                    </li>
                ))}
            </ul>,
        );
    }

    return <Popup>{children}</Popup>;
}

export function StationIconLayer({
    stations,
    answerToColor = new Map(),
}: {
    stations: FeatureCollection<Point, AnnotatedStationProperties>;
    answerToColor?: Map<string, string>;
}) {
    return (
        <LayerGroup>
            {stations.features.map((s) => {
                const [lon, lat] = s.geometry.coordinates;

                const colors = s.properties.possibleAnswers
                    ? s.properties.possibleAnswers.map(
                          (a) => answerToColor.get(a) ?? palette.primary,
                      )
                    : undefined;

                const icon = L.divIcon({
                    // @ts-expect-error: Leaflet type hint is wrong, html can be anything accepted by HTMLDivElement.appendChild
                    html: stationIcon(colors),
                    className: "",
                    iconSize: [MARKER_SIZE, MARKER_SIZE],
                });

                return (
                    <Marker key={s.properties.id} position={[lat, lon]} icon={icon}>
                        <StationPopup properties={s.properties} answerToColor={answerToColor} />
                    </Marker>
                );
            })}
        </LayerGroup>
    );
}

export function StationZoneLayer({
    stations,
    radius,
    answerToColor = new Map(),
}: {
    stations: FeatureCollection<Point, AnnotatedStationProperties>;
    radius: number;
    answerToColor?: Map<string, string>;
}) {
    return (
        <LayerGroup>
            {stations.features.map((s) => {
                const [lon, lat] = s.geometry.coordinates;

                return (
                    <Circle key={s.properties.id} center={[lat, lon]} radius={radius * 1000}>
                        <StationPopup properties={s.properties} answerToColor={answerToColor} />
                    </Circle>
                );
            })}
        </LayerGroup>
    );
}

export function StationLayer() {
    const preset = useStore($preset);
    const stagingQuestion = useStore($stagingQuestion);
    const disabledStations = useStore($disabledStations);
    const hidingZoneRadius = useStore($hidingZoneRadius);
    const showHidingZones = useStore($showHidingZones);

    const visibleStations = {
        type: "FeatureCollection" as const,
        features: preset.stations.features.filter(
            (s) => !Object.hasOwn(disabledStations, s.properties.id),
        ),
    };

    const annotatedStations: FeatureCollection<Point, AnnotatedStationProperties> =
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

    if (showHidingZones && hidingZoneRadius > 0) {
        return (
            <StationZoneLayer
                stations={annotatedStations}
                radius={hidingZoneRadius}
                answerToColor={answerToColor}
            />
        );
    }

    return <StationIconLayer stations={annotatedStations} answerToColor={answerToColor} />;
}
