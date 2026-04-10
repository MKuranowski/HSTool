// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as MatchPointQuestion from "../../model/Question/MatchPointQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CandidateSelector from "./common/CandidateSelector";
import CommonButtons from "./common/CommonButtons";
import PositionSelector from "./common/PositionSelector";

export default function MatchPointQuestionForm({
    q,
    index,
}: {
    q: MatchPointQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    return (
        <>
            <CandidateSelector current={q.name} kind="match-point" index={index} className="mb-2" />
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" />
            <BinaryAnswerButtons negative="hit" positive="miss" answer={q.answer} index={index} />
            <CommonButtons index={index} />
        </>
    );
}
