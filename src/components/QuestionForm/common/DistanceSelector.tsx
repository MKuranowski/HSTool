// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Form, InputGroup } from "react-bootstrap";
import { getQuestionState } from "../../../helper/ui";
import * as Question from "../../../model/Question";

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
                    if (q) {
                        setQuestion(Question.withDistance(q, value));
                    }
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}
