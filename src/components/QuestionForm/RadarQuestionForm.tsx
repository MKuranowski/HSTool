// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { type RadarQuestion } from "../../model/question/index.ts";
import BinaryAnswerButtons from "./common/BinaryAnswerButtons.tsx";
import CommonButtons from "./common/CommonButtons.tsx";
import DistanceSelector from "./common/DistanceSelector.tsx";
import PositionSelector from "./common/PositionSelector.tsx";

export default function RadarQuestionForm({
    q,
    index,
}: {
    q: RadarQuestion;
    index: number | null;
}) {
    return (
        <>
            <DistanceSelector q={q} className="mb-2" />
            <PositionSelector q={q} className="mb-2" />
            <CommonButtons q={q} index={index}>
                <BinaryAnswerButtons q={q} />
            </CommonButtons>
        </>
    );
}
