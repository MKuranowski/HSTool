// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch } from "@preact/signals-core";
import { useSignals } from "@preact/signals-react/runtime";
import type { Feature, Point } from "geojson";
import { Button, ButtonGroup, ListGroup, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import type { Named } from "../model/props.ts";
import $ from "../state.ts";

function StationListElement({
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
                <ButtonGroup className="ms-auto">
                    <OverlayTrigger
                        overlay={
                            <Tooltip id={`${station.properties.id}-hide`}>Start Hider Mode</Tooltip>
                        }
                    >
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                                $.endGameStation.value = station;
                                $.hiderMode.value = true;
                            }}
                        >
                            <i className="bi bi-house-door" />
                        </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                        overlay={
                            <Tooltip id={`${station.properties.id}-end-game`}>
                                Start End Game
                            </Tooltip>
                        }
                    >
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                $.endGameStation.value = station;
                                $.hiderMode.value = false;
                            }}
                        >
                            <i className="bi bi-flag" />
                        </Button>
                    </OverlayTrigger>
                </ButtonGroup>
            </Stack>
        </ListGroup.Item>
    );
}

function StationList() {
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
            <p>Click on a station name to disable it. Eliminated stations are not listed.</p>
            <ListGroup>
                {stations.map((station) =>
                    StationListElement({
                        station,
                        isDiscarded: $.discardedStations.value.has(station.properties.id),
                    })
                )}
            </ListGroup>
        </>
    );
}

function EndGameStation({ s }: { s: Feature<Point, Named> }) {
    return (
        <>
            <p>
                In end game at <strong>{s.properties.name}</strong>.
            </p>
            <Button
                size="sm"
                variant="danger"
                onClick={() => {
                    const confirmDialog = "Do you want to leave the end game? " +
                        "This will reset all questions to non-end-game.";

                    if (window.confirm(confirmDialog)) {
                        batch(() => {
                            $.endGameStation.value = null;
                            for (const q of $.questions.value) q.inEndGame.value = false;
                        });
                    }
                }}
            >
                Abandon End Game
            </Button>
        </>
    );
}

function HiderStation({ s }: { s: Feature<Point, Named> }) {
    return (
        <>
            <p>
                Hiding at <strong>{s.properties.name}</strong>.
            </p>
            <Button
                size="sm"
                variant="danger"
                onClick={() => {
                    batch(() => {
                        $.endGameStation.value = null;
                        $.hiderMode.value = false;
                    });
                }}
            >
                Disable hider mode
            </Button>
        </>
    );
}

export default function Stations() {
    useSignals();
    const hiderStation = $.hiderStation.value;
    const endGameStation = $.endGameStation.value;

    if (hiderStation) {
        return <HiderStation s={hiderStation} />;
    } else if (endGameStation) {
        return <EndGameStation s={endGameStation} />;
    } else {
        return <StationList />;
    }
}
