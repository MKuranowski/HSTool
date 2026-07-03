// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignalEffect } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useSignalRef } from "@preact/signals-react/utils";
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toString } from "../../helper/strings.ts";
import { type ThermometerQuestion } from "../../model/question/index.ts";
import $ from "../../state.ts";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons.tsx";
import CommonButtons from "./common/CommonButtons.tsx";
import DistanceSelector from "./common/DistanceSelector.tsx";
import PositionSelector from "./common/PositionSelector.tsx";

function AzimuthSelector({ q, className }: { q: ThermometerQuestion; className?: string }) {
    // useSignals(); // not needed, changes are handled by useSignalEffect
    const input = useSignalRef<HTMLInputElement | null>(null);

    useSignalEffect(() => {
        if (input.current && q.azimuth.value !== input.current.valueAsNumber) {
            input.current.valueAsNumber = q.azimuth.value;
            input.current.classList.remove("is-invalid");
        }
    });

    return (
        <InputGroup className={className}>
            <InputGroup.Text>Azimuth</InputGroup.Text>
            <Form.Control
                ref={input}
                type="number"
                min="0"
                max="360"
                step="1"
                defaultValue={q.azimuth.peek()}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (Number.isFinite(num) && num >= 0 && num <= 360) {
                        q.setAzimuth(num);
                        input.current?.classList.remove("is-invalid");
                    } else {
                        input.current?.classList.add("is-invalid");
                    }
                }}
            />
            <InputGroup.Text>°</InputGroup.Text>
        </InputGroup>
    );
}

function EndPositionLabel({ q }: { q: ThermometerQuestion }) {
    useSignals();
    const [lon, lat] = q.endLocation.value;

    return (
        <InputGroup className="mb-2">
            <OverlayTrigger
                overlay={<Tooltip id={`q-${q.id}-end-gps-copy`}>Copy to clipboard</Tooltip>}
            >
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        const [lon, lat] = q.endLocation.peek();
                        const coords = `${lat.toString()}, ${lon.toString()}`;
                        navigator.clipboard.writeText(coords).catch((error: unknown) => {
                            console.error("Failed to paste end position:", error);
                            $.toast.value = {
                                header: "Failed to paste end position",
                                body: toString(error),
                                variant: "danger",
                            };
                        });
                    }}
                >
                    <i className="bi bi-copy" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger
                overlay={<Tooltip id={`q-${q.id}-end-gps-paste`}>Paste from clipboard</Tooltip>}
            >
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        navigator.clipboard
                            .readText()
                            .then((content) => {
                                const matches = [...content.matchAll(/-?[0-9]+(?:\.[0-9]+)/g)];
                                if (matches.length !== 2) {
                                    throw new Error(
                                        `Unable to extract lat/lon from ${JSON.stringify(content)}`,
                                    );
                                }

                                const lat = Number.parseFloat(matches[0][0]);
                                const lon = Number.parseFloat(matches[1][0]);
                                q.setEndLocation([lon, lat]);
                            })
                            .catch((error: unknown) => {
                                console.error("Failed to read end position from clipboard:", error);
                                $.toast.value = {
                                    header: "Failed to read end position",
                                    body: toString(error),
                                    variant: "danger",
                                };
                            });
                    }}
                >
                    <i className="bi bi-clipboard" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-end-lat`}>End Latitude</Tooltip>}>
                <InputGroup.Text>
                    φ<sub>1</sub>
                </InputGroup.Text>
            </OverlayTrigger>
            <Form.Control type="number" value={lat} disabled />
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}end-lon`}>End Longitude</Tooltip>}>
                <InputGroup.Text>
                    λ<sub>1</sub>
                </InputGroup.Text>
            </OverlayTrigger>
            <Form.Control type="number" value={lon} disabled />
        </InputGroup>
    );
}

export default function ThermometerQuestionForm({
    q,
    index,
}: {
    q: ThermometerQuestion;
    index: number | null;
}) {
    return (
        <>
            <DistanceSelector q={q} className="mb-2" />
            <AzimuthSelector q={q} className="mb-2" />
            <PositionSelector q={q} className="mb-2" isStart />
            <EndPositionLabel q={q} />
            <CommonButtons q={q} index={index}>
                <BinaryAnswerButtons q={q} />
            </CommonButtons>
        </>
    );
}
