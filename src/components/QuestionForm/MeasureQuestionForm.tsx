// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as MeasureQuestion from "../../model/Question/MeasureQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";
import PositionSelector from "./common/PositionSelector";

export default function MeasureQuestionForm({
    q,
    index,
}: {
    q: MeasureQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    return (
        <>
            <p>TODO</p>
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" />
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
