// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed, type ReadonlySignal, Signal } from "@preact/signals-react";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { categorizeBinary, withAnswers } from "../../helper/answer.ts";
import { distanceToFeature } from "../../helper/geo/dist.ts";
import type { Area } from "../geo.ts";
import type { Answer, Answered, Identified } from "../props.ts";
import BaseQuestion, { type BaseQuestionParams } from "./base.ts";
import {
    WithCandidates,
    type WithCandidatesParams,
    WithSeekers,
    type WithSeekersParams,
} from "./mixin.ts";

const ANSWERS: ReadonlySignal<readonly ["hit", "miss"]> = new Signal(["hit", "miss"] as const);

export interface MatchAreaQuestionParams
    extends BaseQuestionParams, WithSeekersParams, WithCandidatesParams<Polygon | MultiPolygon> {}

/**
 * Matching question, where available features are areas (Polygons or MultiPolygons).
 *
 * The answer is a "hit" if hiders are in the same area as hiders, and a "miss" otherwise.
 *
 * Undefined behavior occurs if areas overlap.
 */
export default class MatchAreaQuestion extends WithCandidates(
    WithSeekers(BaseQuestion),
    "Polygon",
    "MultiPolygon",
) {
    override readonly kind = "match-area";
    override readonly name = computed(() => `Match: ${this.candidatesName.value}`);
    override readonly answers = ANSWERS;

    constructor(p: MatchAreaQuestionParams = {}) {
        super(p);
    }

    /** Area containing the seekers */
    readonly seekersMatch = computed(() => this.findMatch(this.seekers.value));

    /** Finds the first area from candidates containing the provided point; undefined otherwise. */
    findMatch(pt: turf.Coord): Feature<Area, Identified> | undefined {
        for (const f of this.candidates.value.features) {
            // XXX: Must use distanceToFeature, as it has correct, spherical geometry.
            //      pointInPolygon assumes euclidean geometry, which is wrong.
            const d = distanceToFeature(pt, f);
            if (d < 0) return f;
        }
        return undefined;
    }

    override categorize(center: turf.helpers.Coord, radius: number): Answer[] {
        if (this.seekersMatch.value === undefined) return [{ id: "miss" }];
        const dist = distanceToFeature(center, this.seekersMatch.value);
        return categorizeBinary(dist, radius, { id: "hit" }, { id: "miss" });
    }

    override divideArea(): FeatureCollection<Area, Answered> | null {
        return withAnswers(
            this.candidates.value,
            (area) =>
                area.properties.id === this.seekersMatch.value?.properties.id
                    ? { id: "hit" }
                    : { id: "miss" },
        );
    }
}
