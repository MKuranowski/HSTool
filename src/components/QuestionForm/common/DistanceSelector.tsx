// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Form, InputGroup } from "react-bootstrap";
import { getQuestionState } from "../../../helper/questionState";
import * as Question from "../../../model/Question";

function validQuestionKind(variant: "distance" | "radius", kind: Question.Kind): boolean {
    if (variant === "radius") return kind === "radar" || kind === "tentacles";
    return kind === "thermometer";
}

export default function DistanceSelector({
    value,
    variant = "distance",
    index,
    className,
}: {
    value: number;
    variant?: "distance" | "radius";
    index: number | null;
    className?: string;
}) {
    const [, getQuestion, setQuestion] = getQuestionState(index);
    return (
        <InputGroup className={className}>
            <InputGroup.Text>{variant === "distance" ? "Distance" : "Radius"}</InputGroup.Text>
            <Form.Control
                type="number"
                min={0}
                step={0.1}
                value={value}
                onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value) || value < 0) return;

                    const q = getQuestion();
                    if (q && validQuestionKind(variant, q.kind)) {
                        setQuestion({ ...q, [variant]: value });
                    }
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}
