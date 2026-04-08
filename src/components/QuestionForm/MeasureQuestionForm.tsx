// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as MeasureQuestion from "../../model/Question/MeasureQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";

export default function MeasureQuestionForm({
    q,
    index,
}: {
    q: MeasureQuestion.T;
    index: number | null;
}) {
    return (
        <>
            <p>TODO</p>
            <BinaryAnswerButtons
                negative="closer"
                positive="further"
                answer={q.answer}
                index={index}
            />
            <CommonButtons index={index} />
        </>
    );
}
