// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toString } from "../../../helper/strings";
import { getQuestionState } from "../../../helper/ui";
import * as Question from "../../../model/Question";
import { $toast } from "../../../state";

function onGpsButton(
    getQuestion: () => Question.T | null,
    setQuestion: (q: Question.T) => void,
): void {
    $toast.set({ header: "Getting GPS location", variant: "primary" });
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const q = getQuestion();
            if (q) {
                $toast.set({ header: "GPS location loaded successfully", variant: "success" });
                setQuestion(Question.withPosition(q, [pos.coords.longitude, pos.coords.latitude]));
            }
        },
        (error) => {
            console.error("Failed to load GPS position:", error);
            if (getQuestion()) {
                $toast.set({
                    header: "Failed to load GPS position",
                    body: toString(error),
                    variant: "danger",
                });
            }
        },
        {
            maximumAge: 180_000,
            timeout: 10_000,
            enableHighAccuracy: true,
        },
    );
}

function onPositionCopy(getter: () => Question.T | null): void {
    const q = getter();
    if (!q || q.kind === "custom") return;

    const [lon, lat] = q.seeker;
    const coords = `${lat.toString()}, ${lon.toString()}`;

    navigator.clipboard.writeText(coords).catch((error: unknown) => {
        console.error("Failed to paste position:", error);
        $toast.set({
            header: "Failed to paste position",
            body: toString(error),
            variant: "danger",
        });
    });
}

function onPositionPaste(
    getQuestion: () => Question.T | null,
    setQuestion: (q: Question.T) => void,
): void {
    navigator.clipboard
        .readText()
        .then((content) => {
            const matches = [...content.matchAll(/-?[0-9]+(?:\.[0-9]+)/g)];
            if (matches.length !== 2) {
                throw new Error(`Unable to extract lat/lon from ${JSON.stringify(content)}`);
            }

            const lat = parseFloat(matches[0][0]);
            const lon = parseFloat(matches[1][0]);
            const q = getQuestion();
            if (q) {
                setQuestion(Question.withPosition(q, [lon, lat]));
            }
        })
        .catch((error: unknown) => {
            console.error("Failed to read position from clipboard:", error);
            $toast.set({
                header: "Failed to read position",
                body: toString(error),
                variant: "danger",
            });
        });
}

export default function PositionSelector({
    lat = 0,
    lon = 0,
    index,
    className,
    isStart = false,
}: {
    lat?: number;
    lon?: number;
    index: number | null;
    className?: string;
    isStart?: boolean | undefined;
}) {
    const [idPrefix, getQuestion, setQuestion] = getQuestionState(index);

    const latIcon = isStart ? (
        <>
            φ<sub>0</sub>
        </>
    ) : (
        <>φ</>
    );
    const lonIcon = isStart ? (
        <>
            λ<sub>0</sub>
        </>
    ) : (
        <>λ</>
    );
    const latLabel = isStart ? "Start Latitude" : "Latitude";
    const lonLabel = isStart ? "Start Longitude" : "Longitude";

    return (
        <InputGroup className={className}>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}gps`}>Pull from GPS</Tooltip>}>
                <Button
                    size="sm"
                    onClick={() => {
                        onGpsButton(getQuestion, setQuestion);
                    }}
                >
                    <i className="bi bi-crosshair" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger
                overlay={<Tooltip id={`${idPrefix}gps-copy`}>Copy to clipboard</Tooltip>}
            >
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        onPositionCopy(getQuestion);
                    }}
                >
                    <i className="bi bi-copy" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger
                overlay={<Tooltip id={`${idPrefix}gps-paste`}>Paste from clipboard</Tooltip>}
            >
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        onPositionPaste(getQuestion, setQuestion);
                    }}
                >
                    <i className="bi bi-clipboard" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}lat`}>{latLabel}</Tooltip>}>
                <InputGroup.Text>{latIcon}</InputGroup.Text>
            </OverlayTrigger>
            <Form.Control
                type="number"
                min={-90}
                max={90}
                step={0.001}
                value={lat}
                onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value) || value < -90 || value > 90) return;

                    const q = getQuestion();
                    if (q) {
                        setQuestion(Question.withPosition(q, [null, value]));
                    }
                }}
            />
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}lon`}>{lonLabel}</Tooltip>}>
                <InputGroup.Text>{lonIcon}</InputGroup.Text>
            </OverlayTrigger>
            <Form.Control
                type="number"
                min={-180}
                max={180}
                step={0.001}
                value={lon}
                onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value) || value < -180 || value > 180) return;

                    const q = getQuestion();
                    if (q) {
                        setQuestion(Question.withPosition(q, [value, null]));
                    }
                }}
            />
        </InputGroup>
    );
}
