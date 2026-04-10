// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Form, InputGroup } from "react-bootstrap";
import { getQuestionState } from "../../helper/questionState";
import * as RadarQuestion from "../../model/Question/RadarQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";
import PositionSelector from "./common/PositionSelector";

function RadiusSelector({
    radius,
    index,
    className,
}: {
    radius: number;
    index: number | null;
    className?: string;
}) {
    const [, getQuestion, setQuestion] = getQuestionState(index);
    return (
        <InputGroup className={className}>
            <InputGroup.Text>Radius</InputGroup.Text>
            <Form.Control
                type="number"
                min={0}
                step={0.1}
                value={radius}
                onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value) || value < 0) return;

                    const q = getQuestion();
                    if (q && q.kind === "radar") {
                        setQuestion({ ...q, radius: value });
                    }
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}

export default function RadarQuestionForm({
    q,
    index,
}: {
    q: RadarQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    return (
        <>
            <RadiusSelector radius={q.radius} index={index} className="mb-2" />
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" />
            <BinaryAnswerButtons negative="hit" positive="miss" answer={q.answer} index={index} />
            <CommonButtons index={index} />
        </>
    );
}
