// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed, type ReadonlySignal, Signal } from "@preact/signals-react";
import type { NearestPoint } from "@turf/nearest-point";
import * as turf from "@turf/turf";
import type { BBox, FeatureCollection, Point } from "geojson";
import { withAnswers } from "../../helper/answer.ts";
import { nearestPointsToCircle } from "../../helper/geo/dist.ts";
import { voronoi } from "../../helper/geo/voronoi.ts";
import * as iter from "../../helper/iter.ts";
import type { Area } from "../geo.ts";
import type { Answer, Answered, Identified } from "../props.ts";
import BaseQuestion, { type BaseQuestionParams } from "./base.ts";
import {
    WithCandidates,
    type WithCandidatesParams,
    WithSeekers,
    type WithSeekersParams,
} from "./mixin.ts";

const ANSWERS: ReadonlySignal<readonly ["hit", "miss"]> = new Signal(["hit", "miss"]);

export interface MatchPointQuestionParams
    extends BaseQuestionParams, WithSeekersParams, WithCandidatesParams<Point> {}

/**
 * Matching question, where available features are points.
 *
 * The answer is a "hit" if hiders' closest point is the same as seekers' closest point;
 * "miss" otherwise.
 *
 * Undefined behavior occurs if two candidate points share the same coordinates.
 */
export default class MatchPointQuestion extends WithCandidates(WithSeekers(BaseQuestion), "Point") {
    override readonly kind = "match-point";
    override readonly name = computed(() => `Match: ${this.candidatesName.value}`);
    override readonly answers = ANSWERS;

    constructor(p: MatchPointQuestionParams = {}) {
        super(p);
    }

    /** Point closest to the seekers */
    readonly seekersMatch = computed(() => this.findMatch(this.seekers.value));

    /** Finds the first point from candidates closest to the provided point; undefined otherwise */
    findMatch(pt: turf.Coord): NearestPoint<Identified> | undefined {
        if (this.candidates.value.features.length === 0) return undefined;
        return turf.nearestPoint(pt, this.candidates.value);
    }

    override categorize(center: turf.helpers.Coord, radius: number): Answer[] {
        const seekersMatch = this.seekersMatch.value;
        if (seekersMatch === undefined) return [{ id: "miss" }];

        const answers = new Set<string>();
        nearestPointsToCircle(this.candidates.value, center, radius).features.forEach((pt) => {
            const answer = pt.properties.id === seekersMatch.properties.id ? "hit" : "miss";
            answers.add(answer);
        });
        return [...iter.map(answers.keys(), (id) => ({ id }))];
    }

    override divideArea(extent: BBox): FeatureCollection<Area, Answered> | null {
        return withAnswers(
            voronoi(this.candidates.value, { extent }),
            (area) =>
                area.properties.id === this.seekersMatch.value?.properties.id
                    ? { id: "hit" }
                    : { id: "miss" },
        );
    }
}
