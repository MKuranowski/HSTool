// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import * as L from "leaflet";
import { useMemo, useRef } from "react";
import { Circle, Marker } from "react-leaflet";
import * as palette from "../../helper/palette.ts";
import $ from "../../state.ts";

export function ThermometerSecondaryMarker() {
    useSignals();

    const markerRef = useRef<L.Marker | null>(null);
    const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(
        () => ({
            dragend() {
                const newPos = markerRef.current?.getLatLng();
                if (newPos === undefined) return;

                const q = $.stagingQuestion.peek();
                if (q && q.kind === "thermometer") {
                    q.setEndLocation([newPos.lng, newPos.lat]);
                }
            },
        }),
        [],
    );

    const stagingQuestion = $.stagingQuestion.value;
    if (!stagingQuestion || stagingQuestion.kind !== "thermometer") return null;

    const [startLon, startLat] = stagingQuestion.seekers.value;
    const [endLon, endLat] = stagingQuestion.endLocation.value;
    return (
        <>
            <Marker
                draggable={true}
                eventHandlers={eventHandlers}
                position={[endLat, endLon]}
                ref={markerRef}
                icon={new L.Icon.Default({ className: "make-marker-red" })}
            />
            <Circle
                interactive={false}
                center={[startLat, startLon]}
                radius={stagingQuestion.distance.value * 1000}
                pathOptions={{
                    color: palette.palette[1],
                    opacity: 0.5,
                    fill: false,
                }}
            />
        </>
    );
}
