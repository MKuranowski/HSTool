// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useStore } from "@nanostores/react";
import type { FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import { Dropdown, DropdownButton, InputGroup } from "react-bootstrap";
import { getQuestionPrefix, getQuestionState } from "../../../helper/questionState";
import type { PropertiesWithID } from "../../../model/Geo";
import * as Preset from "../../../model/Preset";
import { $preset } from "../../../state";

type Kind = "match-area" | "match-point" | "measure" | "tentacles";

function getViableCandidates(preset: Preset.T, kind: Kind): string[] {
    switch (kind) {
        case "match-area":
            return Object.keys(preset.areas ?? {});

        case "match-point":
        case "tentacles":
            return Object.keys(preset.points ?? {});

        case "measure":
            return [...Object.keys(preset.points ?? {}), ...Object.keys(preset.lines ?? {})];
    }
}

function selectViableCandidates(
    preset: Preset.T,
    kind: Kind,
    name: string,
): FeatureCollection<Point | LineString | Polygon | MultiPolygon, PropertiesWithID> | undefined {
    switch (kind) {
        case "match-area":
            return preset.areas?.[name];

        case "match-point":
        case "tentacles":
            return preset.points?.[name];

        case "measure":
            return preset.points?.[name] ?? preset.lines?.[name];
    }
}

function CandidatesList({
    current,
    kind,
    index,
}: {
    current: string;
    kind: Kind;
    index: number | null;
}) {
    const preset = useStore($preset);
    const [, getQuestion, setQuestion] = getQuestionState(index);
    return (
        <>
            {getViableCandidates(preset, kind).map((name) => (
                <Dropdown.Item
                    key={name}
                    active={name === current}
                    onClick={() => {
                        const q = getQuestion();
                        if (q && q.kind === kind) {
                            const candidates = selectViableCandidates(preset, kind, name);
                            if (candidates) {
                                // @ts-expect-error selectViableCandidates returns the correct geometries for given kind
                                setQuestion({ ...q, name, candidates });
                            }
                        }
                    }}
                >
                    {name}
                </Dropdown.Item>
            ))}
        </>
    );
}

export default function CandidateSelector({
    current,
    kind,
    index,
    className,
}: {
    current: string;
    kind: Kind;
    index: number | null;
    className?: string;
}) {
    const idPrefix = getQuestionPrefix(index);
    return (
        <InputGroup className={className}>
            <InputGroup.Text>Candidates</InputGroup.Text>
            <DropdownButton id={`${idPrefix}candidates`} variant="secondary" title={current}>
                <CandidatesList current={current} kind={kind} index={index} />
            </DropdownButton>
        </InputGroup>
    );
}
