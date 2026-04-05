// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { Feature, Point } from "geojson";
import { Button, ButtonGroup, ListGroup } from "react-bootstrap";
import * as record from "../helper/record";
import type { PropertiesWithName } from "../model/schema";
import {
    $automaticallyEliminatedQuestions,
    $manuallyEliminatedQuestions,
    $preset,
} from "../model/state";

function Station({
    station,
    isEliminated = false,
}: {
    station: Feature<Point, PropertiesWithName>;
    isEliminated?: boolean;
}) {
    return (
        <ListGroup.Item
            onClick={() => {
                const old = $manuallyEliminatedQuestions.get();
                const new_ = (isEliminated ? record.remove : record.add)(
                    old,
                    station.properties.id,
                );
                $manuallyEliminatedQuestions.set(new_);
            }}
            key={station.properties.id}
            className={isEliminated ? "strikethrough" : ""}
        >
            {station.properties.name}
        </ListGroup.Item>
    );
}

export default function Stations() {
    const preset = useStore($preset);
    const automaticallyEliminatedStations = useStore($automaticallyEliminatedQuestions);
    const manuallyEliminatedStations = useStore($manuallyEliminatedQuestions);

    const stations = preset.stations.features.filter(
        (s) => !record.contains(automaticallyEliminatedStations, s.properties.id),
    );
    const collator = new Intl.Collator();
    stations.sort((a, b) => collator.compare(a.properties.name, b.properties.name));

    return (
        <>
            <ButtonGroup className="d-flex justify-content-center mb-2">
                <Button
                    className="flex-grow-0"
                    variant="success"
                    onClick={() => {
                        $manuallyEliminatedQuestions.set({});
                    }}
                >
                    Enable All
                </Button>
                <Button
                    className="flex-grow-0"
                    variant="danger"
                    onClick={() => {
                        $manuallyEliminatedQuestions.set(
                            record.new_(...preset.stations.features.map((s) => s.properties.id)),
                        );
                    }}
                >
                    Disable All
                </Button>
            </ButtonGroup>
            <ListGroup>
                {preset.stations.features.map((station) =>
                    Station({
                        station,
                        isEliminated: record.contains(
                            manuallyEliminatedStations,
                            station.properties.id,
                        ),
                    }),
                )}
            </ListGroup>
        </>
    );
}
