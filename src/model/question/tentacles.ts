// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed } from "@preact/signals-react";
import * as turf from "@turf/turf";
import type { BBox, Feature, FeatureCollection, Geometry, Point } from "geojson";
import { isArea, soleDivision } from "../../helper/geo/area.ts";
import { distanceToFeature, nearestPointsToCircle } from "../../helper/geo/dist.ts";
import { voronoi } from "../../helper/geo/voronoi.ts";
import type { Area } from "../geo.ts";
import type { Answer, Answered, Identified } from "../props.ts";
import BaseQuestion, { type BaseQuestionParams } from "./base.ts";
import {
    WithCandidates,
    type WithCandidatesParams,
    WithDistance,
    type WithDistanceParams,
    WithSeekers,
    type WithSeekersParams,
} from "./mixin.ts";

const NIL: Answer = { id: "__nil", name: "(nil answer)" };

export interface TentaclesQuestionParams
    extends
        BaseQuestionParams,
        WithSeekersParams,
        WithDistanceParams,
        WithCandidatesParams<Point> {}

/**
 * Tentacles question, where the answer is the closest feature to the hiders,
 * or nil if hiders are further than {@link distance} from {@link seekers}.
 *
 * Only {@link candidates} within {@link distance} from {@link seekers} are considered -
 * see {@link viableCandidates}.
 */
export default class TentaclesQuestion extends WithCandidates(
    WithDistance(WithSeekers(BaseQuestion)),
    "Point",
) {
    override readonly kind = "tentacles";
    override readonly name = computed(() => `Tentacles: ${this.candidatesName.value}`);

    constructor(p: TentaclesQuestionParams = {}) {
        super(p);
    }

    /**
     * Candidates actually used for the tentacles.
     * Subset of {@link candidates} within {@link distance} of {@link seekers}.
     */
    readonly viableCandidates = computed(() =>
        turf.featureCollection(
            this.candidates.value.features.filter(
                (candidate) =>
                    distanceToFeature(this.seekers.value, candidate) < this.distance.value,
            ),
        )
    );

    override readonly answers = computed(() => [
        NIL.id,
        ...this.viableCandidates.value.features.map((f) => f.properties.id),
    ]);

    override categorize(center: turf.helpers.Coord, radius: number): Answer[] {
        // No viable candidates - the only answer is nil
        if (this.viableCandidates.value.features.length === 0) {
            return [NIL];
        }

        // Check if nil is the only answer possible
        const distanceToSeekers = turf.distance(this.seekers.value, center);
        if (distanceToSeekers > this.distance.value + radius) {
            return [NIL];
        }

        const answers: Answer[] = [];

        // Check if nil is possible
        if (distanceToSeekers >= this.distance.value - radius) {
            answers.push(NIL);
        }

        // Check which candidates could be returned
        nearestPointsToCircle(this.viableCandidates.value, center, radius).features.forEach((f) => {
            answers.push(featureToAnswer(f));
        });

        return answers;
    }

    override divideArea(extent: BBox): FeatureCollection<Area, Answered> | null {
        // Figure out the candidates for tentacles - if there are none, the only possible answer is nil
        if (this.viableCandidates.value.features.length === 0) return soleDivision(extent, NIL);

        // Calculate the area where tentacles are effective
        const effectiveCircle = turf.bboxClip(
            turf.circle(this.seekers.value, this.distance.value, { steps: 512 }),
            extent,
        );
        if (!isArea(effectiveCircle)) return soleDivision(extent, NIL);

        // Find if a nil answer is possible, and add it as a possible division
        const divisions: Feature<Area, Answered>[] = [];
        const nilArea = turf.difference(
            turf.featureCollection<Area>([turf.bboxPolygon(extent), effectiveCircle]),
        );
        if (nilArea !== null) {
            divisions.push({ ...nilArea, properties: { id: NIL.id, answer: NIL } });
        }

        // Add divisions by voronoi-ing the candidates in the effective circle
        for (
            const area of voronoi(this.viableCandidates.value, {
                extent: turf.bbox(effectiveCircle),
            }).features
        ) {
            const effectiveArea = turf.intersect(turf.featureCollection([area, effectiveCircle]), {
                properties: { ...area.properties, answer: featureToAnswer(area) },
            });
            if (effectiveArea !== null) divisions.push(effectiveArea);
        }

        return turf.featureCollection(divisions);
    }
}

function featureToAnswer(f: Feature<Geometry, Identified>): Answer {
    return { id: f.properties.id, name: f.properties.name };
}
