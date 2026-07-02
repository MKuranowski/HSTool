// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignalEffect } from "@preact/signals-react";
import { useRef } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { type QuestionWithDistance } from "../../../model/question/index.ts";

export default function DistanceSelector({
    q,
    className,
}: {
    q: QuestionWithDistance;
    className?: string;
}) {
    // useSignals(); // not needed, changes are handled by useSignalEffect
    const input = useRef<HTMLInputElement | null>(null);

    useSignalEffect(() => {
        if (input.current && q.distance.value !== input.current.valueAsNumber) {
            input.current.valueAsNumber = q.distance.value;
        }
    });

    return (
        <InputGroup className={className}>
            <InputGroup.Text>Distance</InputGroup.Text>
            <Form.Control
                ref={input}
                type="number"
                min="0"
                step="0.1"
                required
                defaultValue={q.distance.peek()}
                onChange={(e) => {
                    const num = Number.parseFloat(e.target.value);
                    if (Number.isFinite(num) && num >= 0) q.setDistance(num);
                }}
            />
            <InputGroup.Text>km</InputGroup.Text>
        </InputGroup>
    );
}
