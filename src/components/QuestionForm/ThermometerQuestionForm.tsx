// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as ThermometerQuestion from "../../model/Question/ThermometerQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";
import PositionSelector from "./common/PositionSelector";

export default function ThermometerQuestionForm({
    q,
    index,
}: {
    q: ThermometerQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    return (
        <>
            <p>TODO</p>
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" />
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
