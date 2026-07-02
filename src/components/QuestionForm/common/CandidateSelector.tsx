// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import type { FeatureCollection, Geometry } from "geojson";
import { Dropdown, DropdownButton, InputGroup } from "react-bootstrap";
import type Preset from "../../../model/preset.ts";
import type { Identified } from "../../../model/props.ts";
import { type QuestionWithCandidates } from "../../../model/question/index.ts";
import $ from "../../../state.ts";

type Kind = QuestionWithCandidates["kind"];

function getViableCandidates(preset: Preset, kind: Kind): string[] {
    switch (kind) {
        case "match-area":
            return Object.keys(preset.areas.value);

        case "match-point":
        case "tentacles":
            return Object.keys(preset.points.value);

        case "measure":
            return [...Object.keys(preset.points.value), ...Object.keys(preset.lines.value)];
    }
}

function getCandidatesCollection(
    preset: Preset,
    name: string,
): FeatureCollection<Geometry, Identified> {
    for (const key of ["areas", "lines", "points"] as const) {
        const set = preset[key].peek()[name];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (set !== undefined) return set;
    }
    return { type: "FeatureCollection", features: [] };
}

function CandidatesList({ q }: { q: QuestionWithCandidates }) {
    useSignals();
    return (
        <>
            {getViableCandidates($.preset, q.kind).map((name) => (
                <Dropdown.Item
                    key={name}
                    active={name === q.candidatesName.value}
                    onClick={() => {
                        const candidates = getCandidatesCollection($.preset, name);
                        q.setAnyCandidates(name, candidates);
                    }}
                >
                    {name}
                </Dropdown.Item>
            ))}
        </>
    );
}

export default function CandidateSelector({
    q,
    className,
}: {
    q: QuestionWithCandidates;
    className?: string;
}) {
    useSignals();
    return (
        <InputGroup className={className}>
            <InputGroup.Text>Candidates</InputGroup.Text>
            <DropdownButton
                id={`q-${q.id}-candidates`}
                variant="secondary"
                title={q.candidatesName.value}
            >
                <CandidatesList q={q} />
            </DropdownButton>
        </InputGroup>
    );
}
