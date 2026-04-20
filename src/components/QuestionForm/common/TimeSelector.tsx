// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { getQuestionState } from "../../../helper/ui";
import * as Timestamp from "../../../model/Timestamp";

export default function TimeSelector({
    time,
    index,
    variant = "askedAt",
    className,
}: {
    time?: Timestamp.T;
    index: number | null;
    variant?: "askedAt" | "answeredAt";
    className?: string | undefined;
}) {
    const [idPrefix, getQuestion, setQuestion] = getQuestionState(index);
    const lockDescription =
        variant === "askedAt" ? "the question is shared" : "an answer is selected";

    return (
        <InputGroup className={className}>
            <InputGroup.Text>{variant === "askedAt" ? "Asked at" : "Answered at"}</InputGroup.Text>
            <Form.Control
                type="datetime-local"
                value={time ? Timestamp.toFormValue(time) : undefined}
                onChange={(e) => {
                    const q = getQuestion();
                    if (q) {
                        setQuestion({ ...q, [variant]: Timestamp.fromFormValue(e.target.value) });
                    }
                }}
            />
            <OverlayTrigger
                overlay={
                    <Tooltip id={`${idPrefix}${variant}-state`}>
                        If unlocked, this field will be automatically updated when {lockDescription}
                    </Tooltip>
                }
            >
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        if (!time) return;

                        const q = getQuestion();
                        if (q) {
                            const newTime = { ...time, explicit: !time.explicit };
                            setQuestion({ ...q, [variant]: newTime });
                        }
                    }}
                >
                    <i className={time?.explicit ? "bi bi-lock" : "bi bi-unlock2"} />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger
                overlay={<Tooltip id={`${idPrefix}${variant}-now`}>Set to now</Tooltip>}
            >
                <Button
                    size="sm"
                    onClick={() => {
                        const q = getQuestion();
                        if (q) {
                            setQuestion({ ...q, [variant]: Timestamp.now() });
                        }
                    }}
                >
                    <i className="bi bi-clock" />
                </Button>
            </OverlayTrigger>
        </InputGroup>
    );
}
