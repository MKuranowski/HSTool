// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import type { Feature, Point } from "geojson";
import { Button, ButtonGroup, ListGroup, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import type { Named } from "../model/props.ts";
import $ from "../state.ts";

function Station({
    station,
    isDiscarded = false,
}: {
    station: Feature<Point, Named>;
    isDiscarded?: boolean;
}) {
    return (
        <ListGroup.Item key={station.properties.id}>
            <Stack direction="horizontal">
                <span
                    onClick={() => {
                        if (isDiscarded) {
                            $.discardedStations.delete(station.properties.id);
                        } else {
                            $.discardedStations.add(station.properties.id);
                        }
                    }}
                    className={isDiscarded ? "strikethrough" : ""}
                >
                    {station.properties.name}
                </span>
                <OverlayTrigger
                    overlay={
                        <Tooltip id={`${station.properties.id}-end-game`}>Start End Game</Tooltip>
                    }
                >
                    <Button
                        size="sm"
                        variant="outline-secondary"
                        className="ms-auto"
                        onClick={() => {
                            $.endGameStation.value = station;
                        }}
                    >
                        <i className="bi bi-flag" />
                    </Button>
                </OverlayTrigger>
            </Stack>
        </ListGroup.Item>
    );
}

export function StationList() {
    useSignals();

    const stations = $.preset.stations.value.features.filter(
        (s) => !$.eliminatedStations.value.has(s.properties.id),
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
                        $.discardedStations.clear();
                    }}
                >
                    Enable All
                </Button>
                <Button
                    className="flex-grow-0"
                    variant="danger"
                    onClick={() => {
                        $.discardedStations.value = new Set(
                            $.preset.stations.value.features.map((s) => s.properties.id),
                        );
                    }}
                >
                    Disable All
                </Button>
            </ButtonGroup>
            <ListGroup>
                {stations.map((station) =>
                    Station({
                        station,
                        isDiscarded: $.discardedStations.value.has(station.properties.id),
                    })
                )}
            </ListGroup>
        </>
    );
}

export function EndGameStation({ s }: { s: Feature<Point, Named> }) {
    return (
        <>
            <p>
                In end game at <strong>{s.properties.name}</strong>.
            </p>
            <Button
                size="sm"
                variant="danger"
                onClick={() => {
                    $.endGameStation.value = null;
                }}
            >
                Abandon End Game
            </Button>
        </>
    );
}

export default function Stations() {
    useSignals();
    const endGameStation = $.endGameStation.value;
    return endGameStation ? <EndGameStation s={endGameStation} /> : <StationList />;
}
