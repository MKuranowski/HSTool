// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignalEffect } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useRef } from "react";
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import type { Question } from "../../../model/question/index.ts";
import Timestamp from "../../../model/timestamp.ts";

export default function TimeSelector({
    q,
    variant = "askedAt",
    className,
}: {
    q: Question;
    variant?: "askedAt" | "answeredAt";
    className?: string | undefined;
}) {
    useSignals(); // needed for properly displaying the lock icon
    const input = useRef<HTMLInputElement | null>(null);
    const signal = q[variant];

    useSignalEffect(() => {
        const timestamp = signal.value;
        if (input.current && timestamp && timestamp.formValue.value !== input.current.value) {
            input.current.value = timestamp.formValue.value;
        }
    });

    const initialTimestamp = signal.peek();
    const initialValue = initialTimestamp ? initialTimestamp.formValue.peek() : undefined;

    const lockDescription = variant === "askedAt"
        ? "the question is shared"
        : "an answer is selected";

    return (
        <InputGroup className={className}>
            <InputGroup.Text>{variant === "askedAt" ? "Asked at" : "Answered at"}</InputGroup.Text>
            <Form.Control
                type="datetime-local"
                defaultValue={initialValue}
                onChange={(e) => {
                    signal.value = new Timestamp(e.target.value, true);
                }}
            />
            <OverlayTrigger
                overlay={
                    <Tooltip id={`q-${q.id}-${variant}-state`}>
                        If unlocked, this field will be automatically updated when {lockDescription}
                    </Tooltip>
                }
            >
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        const t = signal.peek();
                        if (t) t.explicit.value = !t.explicit.peek();
                    }}
                >
                    <i className={signal.value?.explicit.value ? "bi bi-lock" : "bi bi-unlock2"} />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-${variant}-now`}>Set to now</Tooltip>}>
                <Button
                    size="sm"
                    onClick={() => {
                        signal.value = new Timestamp(undefined, true);
                    }}
                >
                    <i className="bi bi-clock" />
                </Button>
            </OverlayTrigger>
        </InputGroup>
    );
}
