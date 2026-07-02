// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import { Form, InputGroup } from "react-bootstrap";
import { type MeasureQuestion } from "../../model/question/index.ts";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons.tsx";
import CandidateSelector from "./common/CandidateSelector.tsx";
import CommonButtons from "./common/CommonButtons.tsx";
import PositionSelector from "./common/PositionSelector.tsx";

export function MeasureDistance({ q }: { q: MeasureQuestion }) {
    useSignals();

    const seekerDistance = q.seekerDistance.value;
    const precision = seekerDistance >= 10 ? 1 : 3;
    const value = seekerDistance.toFixed(precision);

    return (
        <>
            <Form.Control
                type="number"
                value={value}
                disabled
            />
            <InputGroup.Text>km</InputGroup.Text>
        </>
    );
}

export default function MeasureQuestionForm({
    q,
    index,
}: {
    q: MeasureQuestion;
    index: number | null;
}) {
    return (
        <>
            <CandidateSelector q={q} className="mb-2">
                <MeasureDistance q={q} />
            </CandidateSelector>
            <PositionSelector q={q} className="mb-2" />
            <CommonButtons q={q} index={index}>
                <BinaryAnswerButtons q={q} />
            </CommonButtons>
        </>
    );
}
