// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useValue } from "@legendapp/state/react";
import type { Feature, Point } from "geojson";
import { Button, ButtonGroup, ListGroup } from "react-bootstrap";
import type { PropertiesWithName } from "../model/schema";
import { $discardedStations, $eliminatedQuestions, $preset } from "../model/state";

function Station({
    station,
    isDiscarded = false,
}: {
    station: Feature<Point, PropertiesWithName>;
    isDiscarded?: boolean;
}) {
    return (
        <ListGroup.Item
            onClick={() => {
                if (isDiscarded) {
                    $discardedStations[station.properties.id].delete();
                } else {
                    $discardedStations[station.properties.id].set(1);
                    console.log("deleted ", station.properties.id, "now", $discardedStations.get());
                }
            }}
            key={station.properties.id}
            className={isDiscarded ? "strikethrough" : ""}
        >
            {station.properties.name}
        </ListGroup.Item>
    );
}

export default function Stations() {
    const allStations = useValue($preset.stations.features);
    const discardedStations = useValue($discardedStations);
    const eliminatedStations = useValue($eliminatedQuestions);

    const stations = allStations.filter((s) => !Object.hasOwn(eliminatedStations, s.properties.id));
    const collator = new Intl.Collator();
    stations.sort((a, b) => collator.compare(a.properties.name, b.properties.name));

    return (
        <>
            <ButtonGroup className="d-flex justify-content-center mb-2">
                <Button
                    className="flex-grow-0"
                    variant="success"
                    onClick={() => {
                        $discardedStations.set({});
                    }}
                >
                    Enable All
                </Button>
                <Button
                    className="flex-grow-0"
                    variant="danger"
                    onClick={() => {
                        const set: Record<string, 1> = {};
                        allStations.forEach((s) => (set[s.properties.id] = 1));
                        $discardedStations.set(set);
                    }}
                >
                    Disable All
                </Button>
            </ButtonGroup>
            <ListGroup>
                {stations.map((station) =>
                    Station({
                        station,
                        isDiscarded: Object.hasOwn(discardedStations, station.properties.id),
                    }),
                )}
            </ListGroup>
        </>
    );
}
