// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import * as L from "leaflet";
import { useMemo, useRef } from "react";
import { Marker } from "react-leaflet";
import { questionHasSeekers } from "../../model/question/index.ts";
import $ from "../../state.ts";

export function QuestionMarker() {
    useSignals();
    const stagingQuestion = $.stagingQuestion.value;

    const markerRef = useRef<L.Marker | null>(null);
    const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(
        () => ({
            dragend() {
                const newPos = markerRef.current?.getLatLng();
                if (newPos === undefined) return;

                const q = $.stagingQuestion.peek();
                if (q && questionHasSeekers(q)) {
                    q.setSeekers([newPos.lng, newPos.lat]);
                }
            },
        }),
        [],
    );

    // Don't display the marker without a staging question
    if (stagingQuestion === null || !questionHasSeekers(stagingQuestion)) {
        return null;
    }

    const position = stagingQuestion.seekers.value.toReversed() as [number, number];

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
