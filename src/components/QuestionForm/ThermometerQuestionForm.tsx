// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toString } from "../../helper/strings";
import { getQuestionPrefix, getQuestionState } from "../../helper/ui";
import * as ThermometerQuestion from "../../model/Question/ThermometerQuestion";
import { $toast } from "../../state";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";
import DistanceSelector from "./common/DistanceSelector";
import PositionSelector from "./common/PositionSelector";

function AzimuthSelector({
    azimuth,
    index,
    className,
}: {
    azimuth: number;
    index: number | null;
    className?: string;
}) {
    const [, getQuestion, setQuestion] = getQuestionState(index);
    return (
        <InputGroup className={className}>
            <InputGroup.Text>Azimuth</InputGroup.Text>
            <Form.Control
                type="number"
                min={0}
                max={360}
                step={1}
                value={azimuth}
                onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value) || value < 0 || value > 360) return;

                    const q = getQuestion();
                    if (q && q.kind === "thermometer") {
                        setQuestion({ ...q, azimuth: value });
                    }
                }}
            />
            <InputGroup.Text>°</InputGroup.Text>
        </InputGroup>
    );
}

function EndPositionLabel({ lat, lon, index }: { lat: number; lon: number; index: number | null }) {
    const idPrefix = getQuestionPrefix(index);
    return (
        <InputGroup className="mb-2">
            <OverlayTrigger
                overlay={<Tooltip id={`${idPrefix}end-gps-copy`}>Copy to clipboard</Tooltip>}
            >
                <Button
                    variant="secondary"
                    onClick={() => {
                        const coords = `${lat.toString()}, ${lon.toString()}`;
                        navigator.clipboard.writeText(coords).catch((error: unknown) => {
                            console.error("Failed to paste end position:", error);
                            $toast.set({
                                header: "Failed to paste end position",
                                body: toString(error),
                                variant: "danger",
                            });
                        });
                    }}
                >
                    <i className="bi bi-copy" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}end-lat`}>End Latitude</Tooltip>}>
                <InputGroup.Text>
                    φ<sub>1</sub>
                </InputGroup.Text>
            </OverlayTrigger>
            <Form.Control type="number" min={-90} max={90} value={lat} disabled />
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}end-lon`}>End Longitude</Tooltip>}>
                <InputGroup.Text>
                    λ<sub>1</sub>
                </InputGroup.Text>
            </OverlayTrigger>
            <Form.Control type="number" min={-180} max={180} value={lon} disabled />
        </InputGroup>
    );
}

export default function ThermometerQuestionForm({
    q,
    index,
}: {
    q: ThermometerQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    const [endLon, endLat] = ThermometerQuestion.getEndLocation(q);
    return (
        <>
            <DistanceSelector value={q.distance} index={index} className="mb-2" />
            <AzimuthSelector azimuth={q.azimuth} index={index} className="mb-2" />
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" isStart />
            <EndPositionLabel lat={endLat} lon={endLon} index={index} />
            <BinaryAnswerButtons
                negative="colder"
                positive="hotter"
                answer={q.answer}
                index={index}
            />
            <CommonButtons index={index} />
        </>
    );
}
