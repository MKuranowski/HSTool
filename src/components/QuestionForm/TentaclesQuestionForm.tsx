// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useComputed, useSignals } from "@preact/signals-react/runtime";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { type TentaclesQuestion } from "../../model/question/index.ts";
import $ from "../../state.ts";
import CandidateSelector from "./common/CandidateSelector.tsx";
import CommonButtons from "./common/CommonButtons.tsx";
import DistanceSelector from "./common/DistanceSelector.tsx";
import PositionSelector from "./common/PositionSelector.tsx";

export function TentaclesAnswerSelector({ q }: { q: TentaclesQuestion }) {
    useSignals();

    const idToName = useComputed(() => {
        return new Map(
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            $.preset.points.value[q.candidatesName.value]?.features
                .filter((f) => f.properties.name !== undefined)
                .map((f) => [f.properties.id, f.properties.name] as const),
        ) as ReadonlyMap<string, string>;
    });

    const current = q.answer.value;
    const currentName = idToName.value.get(current ?? "") ?? current ?? "(No answer)";

    return (
        <DropdownButton id={`q-${q.id}-answer`} title={currentName}>
            <Dropdown.Item
                key="(no answer)"
                active={current === undefined}
                onClick={() => {
                    q.setAnswer(undefined);
                }}
            >
                (No answer)
            </Dropdown.Item>
            {q.answers.value.map((id) => (
                <Dropdown.Item
                    key={id}
                    active={id === current}
                    onClick={() => {
                        q.setAnswer(id);
                    }}
                >
                    {idToName.value.get(id) ?? id}
                </Dropdown.Item>
            ))}
        </DropdownButton>
    );
}

export default function TentaclesQuestionForm({
    q,
    index,
}: {
    q: TentaclesQuestion;
    index: number | null;
}) {
    return (
        <>
            <CandidateSelector q={q} className="mb-2" />
            <DistanceSelector q={q} className="mb-2" />
            <PositionSelector q={q} className="mb-2" />
            <CommonButtons q={q} index={index}>
                <TentaclesAnswerSelector q={q} />
            </CommonButtons>
        </>
    );
}
