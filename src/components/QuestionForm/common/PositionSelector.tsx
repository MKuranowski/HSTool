// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignalEffect } from "@preact/signals-react";
import { useSignalRef } from "@preact/signals-react/utils";
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toString } from "../../../helper/strings.ts";
import { type QuestionWithSeekers } from "../../../model/question/index.ts";
import $ from "../../../state.ts";

function onGpsButton(q: QuestionWithSeekers): void {
    $.toast.value = { header: "Getting GPS location", variant: "primary" };
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            $.toast.value = { header: "GPS location loaded successfully", variant: "success" };
            q.setSeekers([pos.coords.longitude, pos.coords.latitude]);
        },
        (error) => {
            console.error("Failed to load GPS position:", error);
            $.toast.value = {
                header: "Failed to load GPS position",
                body: toString(error),
                variant: "danger",
            };
        },
        {
            maximumAge: 180_000,
            timeout: 10_000,
            enableHighAccuracy: true,
        },
    );
}

function onPositionCopy(q: QuestionWithSeekers): void {
    const [lon, lat] = q.seekers.peek();
    const coords = `${lat.toString()}, ${lon.toString()}`;

    navigator.clipboard.writeText(coords).catch((error: unknown) => {
        console.error("Failed to paste position:", error);
        $.toast.value = {
            header: "Failed to paste position",
            body: toString(error),
            variant: "danger",
        };
    });
}

function onPositionPaste(q: QuestionWithSeekers): void {
    navigator.clipboard
        .readText()
        .then((content) => {
            const matches = [...content.matchAll(/-?[0-9]+(?:\.[0-9]+)/g)];
            if (matches.length !== 2) {
                throw new Error(`Unable to extract lat/lon from ${JSON.stringify(content)}`);
            }

            const lat = Number.parseFloat(matches[0][0]);
            const lon = Number.parseFloat(matches[1][0]);
            q.setSeekers([lon, lat]);
        })
        .catch((error: unknown) => {
            console.error("Failed to read position from clipboard:", error);
            $.toast.value = {
                header: "Failed to read position",
                body: toString(error),
                variant: "danger",
            };
        });
}

export default function PositionSelector({
    q,
    className,
    isStart = false,
}: {
    q: QuestionWithSeekers;
    className?: string;
    isStart?: boolean | undefined;
}) {
    // useSignals(); // not needed, changes are handled by useSignalEffect
    const latInput = useSignalRef<HTMLInputElement | null>(null);
    const lonInput = useSignalRef<HTMLInputElement | null>(null);

    useSignalEffect(() => {
        if (latInput.current && q.seekers.value[1] != latInput.current.valueAsNumber) {
            latInput.current.valueAsNumber = q.seekers.value[1];
            latInput.current.classList.remove("is-invalid");
        }
    });

    useSignalEffect(() => {
        if (lonInput.current && q.seekers.value[0] != lonInput.current.valueAsNumber) {
            lonInput.current.valueAsNumber = q.seekers.value[0];
            lonInput.current.classList.remove("is-invalid");
        }
    });

    const latIcon = isStart
        ? (
            <>
                φ<sub>0</sub>
            </>
        )
        : <>φ</>;
    const lonIcon = isStart
        ? (
            <>
                λ<sub>0</sub>
            </>
        )
        : <>λ</>;
    const latLabel = isStart ? "Start Latitude" : "Latitude";
    const lonLabel = isStart ? "Start Longitude" : "Longitude";

    return (
        <InputGroup className={className}>
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-gps`}>Pull from GPS</Tooltip>}>
                <Button
                    size="sm"
                    onClick={() => {
                        onGpsButton(q);
                    }}
                >
                    <i className="bi bi-crosshair" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger
                overlay={<Tooltip id={`q-${q.id}-gps-copy`}>Copy to clipboard</Tooltip>}
            >
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        onPositionCopy(q);
                    }}
                >
                    <i className="bi bi-copy" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger
                overlay={<Tooltip id={`q-${q.id}-gps-paste`}>Paste from clipboard</Tooltip>}
            >
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        onPositionPaste(q);
                    }}
                >
                    <i className="bi bi-clipboard" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-lat`}>{latLabel}</Tooltip>}>
                <InputGroup.Text>{latIcon}</InputGroup.Text>
            </OverlayTrigger>
            <Form.Control
                ref={latInput}
                type="number"
                min="-90"
                max="90"
                step="0.001"
                defaultValue={q.seekers.peek()[1]}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (Number.isFinite(num) && num >= -90 && num <= 90) {
                        q.setSeekers([undefined, num]);
                        latInput.current?.classList.remove("is-invalid");
                    } else {
                        latInput.current?.classList.add("is-invalid");
                    }
                }}
            />
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-lon`}>{lonLabel}</Tooltip>}>
                <InputGroup.Text>{lonIcon}</InputGroup.Text>
            </OverlayTrigger>
            <Form.Control
                ref={lonInput}
                type="number"
                min="-180"
                max="180"
                step="0.001"
                defaultValue={q.seekers.peek()[0]}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (Number.isFinite(num) && num >= -180 && num <= 180) {
                        q.setSeekers([num, undefined]);
                        lonInput.current?.classList.remove("is-invalid");
                    } else {
                        lonInput.current?.classList.add("is-invalid");
                    }
                }}
            />
        </InputGroup>
    );
}
