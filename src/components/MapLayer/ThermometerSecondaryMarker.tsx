// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import * as turf from "@turf/turf";
import * as L from "leaflet";
import { useMemo, useRef } from "react";
import { Circle, Marker } from "react-leaflet";
import * as palette from "../../helper/palette";
import * as ThermometerQuestion from "../../model/Question/ThermometerQuestion";
import { $stagingQuestion } from "../../state";

export function ThermometerSecondaryMarker() {
    const stagingQuestion = useStore($stagingQuestion);
    const markerRef = useRef<L.Marker | null>(null);
    const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(
        () => ({
            dragend() {
                const newPosLeaflet = markerRef.current?.getLatLng();
                if (newPosLeaflet === undefined) return;
                const newPos = [newPosLeaflet.lng, newPosLeaflet.lat];

                const q = $stagingQuestion.get();
                if (!q || q.kind !== "thermometer") return;

                const azimuth = turf.bearingToAzimuth(turf.bearing(q.seeker, newPos));
                $stagingQuestion.set({ ...q, azimuth });
            },
        }),
        [],
    );

    if (!stagingQuestion || stagingQuestion.kind !== "thermometer") return null;

    const [startLon, startLat] = stagingQuestion.seeker;
    const [endLon, endLat] = ThermometerQuestion.getEndLocation(stagingQuestion);
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
                radius={stagingQuestion.distance * 1000}
                pathOptions={{
                    color: palette.palette[1],
                    opacity: 0.5,
                    fill: false,
                }}
            />
        </>
    );
}
