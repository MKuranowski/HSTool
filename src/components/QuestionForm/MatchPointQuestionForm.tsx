// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import { FormControl } from "react-bootstrap";
import { type MatchPointQuestion } from "../../model/question/index.ts";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons.tsx";
import CandidateSelector from "./common/CandidateSelector.tsx";
import CommonButtons from "./common/CommonButtons.tsx";
import PositionSelector from "./common/PositionSelector.tsx";

export function MatchedPoint({ q }: { q: MatchPointQuestion }) {
    useSignals();
    const matched = q.seekersMatch.value?.properties;
    const name = matched?.name ?? matched?.id ?? "";
    return (
        <FormControl
            type="text"
            value={name}
            disabled
        />
    );
}
export default function MatchPointQuestionForm({
    q,
    index,
}: {
    q: MatchPointQuestion;
    index: number | null;
}) {
    return (
        <>
            <CandidateSelector q={q} className="mb-2">
                <MatchedPoint q={q} />
            </CandidateSelector>
            <PositionSelector q={q} className="mb-2" />
            <CommonButtons q={q} index={index}>
                <BinaryAnswerButtons q={q} />
            </CommonButtons>
        </>
    );
}
