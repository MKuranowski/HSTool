// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as ThermometerQuestion from "../../model/Question/ThermometerQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";

export default function ThermometerQuestionForm({
    q,
    index,
}: {
    q: ThermometerQuestion.T;
    index: number | null;
}) {
    return (
        <>
            <p>TODO</p>
            <BinaryAnswerButtons
                negative="colder"
                positive="hotter"
                answer={q.answer}
                index={index}
            />
            <CommonButtons index={index} />
        </>
    );
}
