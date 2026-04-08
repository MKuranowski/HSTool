// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as MatchPointQuestion from "../../model/Question/MatchPointQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";

export default function MatchPointQuestionForm({
    q,
    index,
}: {
    q: MatchPointQuestion.T;
    index: number | null;
}) {
    return (
        <>
            <p>TODO</p>
            <BinaryAnswerButtons negative="hit" positive="miss" answer={q.answer} index={index} />
            <CommonButtons index={index} />
        </>
    );
}
