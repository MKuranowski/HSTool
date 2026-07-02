// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { type MatchAreaQuestion } from "../../model/question/index.ts";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons.tsx";
import CandidateSelector from "./common/CandidateSelector.tsx";
import CommonButtons from "./common/CommonButtons.tsx";
import PositionSelector from "./common/PositionSelector.tsx";

export default function MatchAreaQuestionForm({
    q,
    index,
}: {
    q: MatchAreaQuestion;
    index: number | null;
}) {
    return (
        <>
            <CandidateSelector q={q} className="mb-2" />
            <PositionSelector q={q} className="mb-2" />
            <CommonButtons q={q} index={index}>
                <BinaryAnswerButtons q={q} />
            </CommonButtons>
        </>
    );
}
