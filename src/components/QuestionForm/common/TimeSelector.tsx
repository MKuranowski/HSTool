// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignalEffect } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useSignalRef } from "@preact/signals-react/utils";
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
    const input = useSignalRef<HTMLInputElement | null>(null);
    const signal = q[variant];

    const isSequencedCorrectly = variant === "askedAt"
        ? () => true
        : () =>
            q.askedAt.value === undefined || signal.value === undefined ||
            signal.value.t.value >= q.askedAt.value.t.value;

    useSignalEffect(() => {
        const timestamp = signal.value;
        if (input.current && timestamp && timestamp.formValue.value !== input.current.value) {
            input.current.value = timestamp.formValue.value;
        }

        // Only remove invalid flag if the time is sequenced correctly.
        // Note that this check must be outside of the above if statement, as that one
        // is only entered when `signal` changes, while the sequencing check may rely on different
        // signals.
        if (input.current) {
            if (isSequencedCorrectly()) {
                input.current.classList.remove("is-invalid");
            } else {
                input.current.classList.add("is-invalid");
            }
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
                ref={input}
                type="datetime-local"
                defaultValue={initialValue}
                onChange={(e) => {
                    let isValid = false;

                    if (e.target.value) {
                        signal.value = new Timestamp(e.target.value, true);
                        isValid = isSequencedCorrectly();
                    } else {
                        signal.value = undefined;
                        isValid = true;
                    }

                    if (isValid) {
                        input.current?.classList.remove("is-invalid");
                    } else {
                        input.current?.classList.add("is-invalid");
                    }
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
