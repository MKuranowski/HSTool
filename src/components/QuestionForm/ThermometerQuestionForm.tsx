// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Form, InputGroup } from "react-bootstrap";
import { getQuestionState } from "../../helper/questionState";
import * as ThermometerQuestion from "../../model/Question/ThermometerQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";
import PositionSelector from "./common/PositionSelector";

function DistanceSelector({
    distance,
    index,
    className,
}: {
    distance: number;
    index: number | null;
    className?: string;
}) {
    const [, getQuestion, setQuestion] = getQuestionState(index);
    return (
        <InputGroup className={className}>
            <InputGroup.Text>Distance</InputGroup.Text>
            <Form.Control
                type="number"
                min={0}
                step={0.1}
                value={distance}
                onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value) || value < 0) return;

                    const q = getQuestion();
                    if (q && q.kind === "thermometer") {
                        setQuestion({ ...q, distance: value });
                    }
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}

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

export default function ThermometerQuestionForm({
    q,
    index,
}: {
    q: ThermometerQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    return (
        <>
            <DistanceSelector distance={q.distance} index={index} className="mb-2" />
            <AzimuthSelector azimuth={q.azimuth} index={index} className="mb-2" />
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" />
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
