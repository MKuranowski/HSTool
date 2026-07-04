// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useComputed, useSignals } from "@preact/signals-react/runtime";
import { ButtonGroup, Dropdown, DropdownButton } from "react-bootstrap";
import { type TentaclesQuestion } from "../../model/question/index.ts";
import { NIL } from "../../model/question/tentacles.ts";
import $ from "../../state.ts";
import CandidateSelector from "./common/CandidateSelector.tsx";
import CommonButtons from "./common/CommonButtons.tsx";
import DeriveAnswerButton from "./common/DeriveAnswerButton.tsx";
import DistanceSelector from "./common/DistanceSelector.tsx";
import PositionSelector from "./common/PositionSelector.tsx";

interface MaybeAnswer {
    id: string | undefined;
    name?: string | undefined;
}

function getAvailableAnswers(q: TentaclesQuestion): (string | undefined)[] {
    const hiderStation = $.hiderStation.value;

    const hiderStationAnswers = hiderStation
        ? q.categorize(hiderStation, $.preset.hidingRadius.value).map((a) => a.id)
        : [];

    const answers = hiderStationAnswers.length > 0
        ? hiderStationAnswers
        : [undefined, ...q.answers.value];

    return answers;
}

function TentaclesAnswerDropdown({ q }: { q: TentaclesQuestion }) {
    useSignals();

    const idToName = useComputed(() => {
        const m = new Map<string, string>();
        m.set(NIL.id, NIL.name);
        for (const s of $.preset.points.value[q.candidatesName.value]?.features ?? []) {
            if (s.properties.name) m.set(s.properties.id, s.properties.name);
        }
        return m as ReadonlyMap<string, string>;
    });

    const current = q.answer.value;
    const currentName = idToName.value.get(current ?? "") ?? current ?? "(No answer)";

    return (
        <DropdownButton
            as={ButtonGroup}
            id={`q-${q.id}-answer`}
            title={currentName}
            variant="secondary"
        >
            {getAvailableAnswers(q).map((id) => {
                const key = id ?? "__no_answer";
                const name = id === undefined ? "(No answer)" : (idToName.value.get(id) ?? id);

                return (
                    <Dropdown.Item
                        key={key}
                        active={id === current}
                        onClick={() => {
                            q.setAnswer(id);
                        }}
                    >
                        {name}
                    </Dropdown.Item>
                );
            })}
        </DropdownButton>
    );
}

function TentaclesAnswerSelector({ q }: { q: TentaclesQuestion }) {
    useSignals();

    const hiderMode = $.hiderStation.value !== null;

    if (hiderMode) {
        return (
            <ButtonGroup>
                <TentaclesAnswerDropdown q={q} />
                <DeriveAnswerButton q={q} />
            </ButtonGroup>
        );
    } else {
        return <TentaclesAnswerDropdown q={q} />;
    }
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
