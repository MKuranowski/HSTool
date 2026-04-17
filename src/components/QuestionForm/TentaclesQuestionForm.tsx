// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import { useMemo } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { getQuestionState } from "../../helper/ui";
import * as TentaclesQuestion from "../../model/Question/TentaclesQuestion";
import { $preset } from "../../state";
import CandidateSelector from "./common/CandidateSelector";
import CommonButtons from "./common/CommonButtons";
import DistanceSelector from "./common/DistanceSelector";
import PositionSelector from "./common/PositionSelector";

export function TentaclesAnswerSelector({
    ids,
    name,
    current,
    index,
}: {
    ids: string[];
    name: string;
    current?: string;
    index: number | null;
}) {
    const preset = useStore($preset);
    const idToName = useMemo(() => {
        return new Map(
            preset.points?.[name]?.features
                .filter((f) => f.properties.name !== undefined)
                .map((f) => [f.properties.id, f.properties.name] as const),
        );
    }, [preset, name]);

    const [idPrefix, getQuestion, setQuestion] = getQuestionState(index);
    const currentName = current !== undefined ? (idToName.get(current) ?? current) : "(No answer)";
    return (
        <DropdownButton
            id={`${idPrefix}answer`}
            title={currentName}
            className="d-inline-block me-2"
        >
            <Dropdown.Item
                key="(no answer)"
                active={current === undefined}
                onClick={() => {
                    const q = getQuestion();
                    if (q && q.kind === "tentacles") {
                        setQuestion({ ...q, answer: undefined });
                    }
                }}
            >
                (No answer)
            </Dropdown.Item>
            {ids.map((id) => (
                <Dropdown.Item
                    key={id}
                    active={id === current}
                    onClick={() => {
                        const q = getQuestion();
                        if (q && q.kind === "tentacles") {
                            setQuestion({ ...q, answer: id });
                        }
                    }}
                >
                    {idToName.get(id) ?? id}
                </Dropdown.Item>
            ))}
        </DropdownButton>
    );
}

export default function TentaclesQuestionForm({
    q,
    index,
}: {
    q: TentaclesQuestion.T;
    index: number | null;
}) {
    const [lon, lat] = q.seeker;
    return (
        <>
            <CandidateSelector current={q.name} kind="tentacles" index={index} className="mb-2" />
            <DistanceSelector value={q.radius} variant="radius" index={index} className="mb-2" />
            <PositionSelector lat={lat} lon={lon} index={index} className="mb-2" />
            <TentaclesAnswerSelector
                ids={TentaclesQuestion.answers(q)}
                name={q.name}
                current={q.answer}
                index={index}
            />
            <CommonButtons index={index} />
        </>
    );
}
