// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import * as L from "leaflet";
import { useMemo, useRef } from "react";
import { Marker } from "react-leaflet";
import * as Question from "../../model/Question";
import { $stagingQuestion } from "../../state";

export function QuestionMarker() {
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
        return null;
    }

    const position = L.latLng(stagingQuestion.seeker[1], stagingQuestion.seeker[0]);

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={new L.Icon.Default({ className: "make-marker-green" })}
        />
    );
}
