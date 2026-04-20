// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as RadarQuestion from "../../model/Question/RadarQuestion";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons";
import CommonButtons from "./common/CommonButtons";
import DistanceSelector from "./common/DistanceSelector";
import PositionSelector from "./common/PositionSelector";

export default function RadarQuestionForm({
    q,
    index,
}: {
    q: RadarQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    return (
        <>
            <DistanceSelector value={q.radius} variant="radius" index={index} className="mb-2" />
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" />
            <CommonButtons q={q} index={index}>
                <BinaryAnswerButtons
                    negative="hit"
                    positive="miss"
                    answer={q.answer}
                    index={index}
                />
            </CommonButtons>
        </>
    );
}
