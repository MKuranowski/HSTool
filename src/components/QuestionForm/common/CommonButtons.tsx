// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { JSX } from "react";
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { $questions, $stagingQuestion } from "../../../state";

export default function CommonButtons({ index }: { index: number | null }) {
    const stagingQuestion = useStore($stagingQuestion);
    const buttons: JSX.Element[] = [];
    const idPrefix = index === null ? `q-form-staging-` : `q-form-${index.toFixed(0)}-`;

    if (index === null) {
        buttons.push(
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}commit`}>Commit</Tooltip>}>
                <Button
                    variant="primary"
                    onClick={() => {
                        const q = $stagingQuestion.get();
                        if (q !== null) {
                            $questions.push(q);
                            $stagingQuestion.set(null);
                        }
                    }}
                >
                    <i className="bi bi-arrow-bar-down" />
                </Button>
            </OverlayTrigger>,
        );
    } else {
        buttons.push(
            <OverlayTrigger overlay={<Tooltip id={`${idPrefix}edit`}>Edit</Tooltip>}>
                <Button
                    variant="primary"
                    onClick={() => {
                        if ($stagingQuestion.get() === null) {
                            const q = $questions.remove(index);
                            $stagingQuestion.set(q ?? null);
                        }
                    }}
                    disabled={stagingQuestion !== null}
                >
                    <i className="bi bi-arrow-bar-up" />
                </Button>
            </OverlayTrigger>,
        );
    }

    buttons.push(
        <OverlayTrigger overlay={<Tooltip id={`${idPrefix}del`}>Delete</Tooltip>}>
            <Button
                variant="secondary"
                onClick={() => {
                    if (index === null) {
                        $stagingQuestion.set(null);
                    } else {
                        $questions.remove(index);
                    }
                }}
            >
                <i className="bi bi-trash" />
            </Button>
        </OverlayTrigger>,
    );

    return <ButtonGroup>{buttons}</ButtonGroup>;
}
