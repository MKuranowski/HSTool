// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { computed, type ReadonlySignal, Signal } from "@preact/signals-react";
import * as turf from "@turf/turf";
import type { BBox, FeatureCollection } from "geojson";
import { categorizeBinary } from "../../helper/answer.ts";
import { isArea, soleDivision } from "../../helper/geo/area.ts";
import type { Area } from "../geo.ts";
import type { Answer, Answered } from "../props.ts";
import BaseQuestion, { type BaseQuestionParams } from "./base.ts";
import {
    WithDistance,
    type WithDistanceParams,
    WithSeekers,
    type WithSeekersParams,
} from "./mixin.ts";

const ANSWERS: ReadonlySignal<readonly ["hit", "miss"]> = new Signal(["hit", "miss"]);

export interface RadarQuestionParams
    extends BaseQuestionParams, WithSeekersParams, WithDistanceParams {}

/**
 * Radar question. The answer is a "hit" if hiders are within {@link distance} of {@link seekers},
 * "miss" otherwise.
 */
export default class RadarQuestion extends WithDistance(WithSeekers(BaseQuestion)) {
    override readonly kind = "radar";
    override readonly name = computed(() => `Radar: ${this.distance.value.toString()} km`);
    override readonly answers = ANSWERS;

    constructor(p: RadarQuestionParams = {}) {
        super(p);
    }

    override categorize(center: turf.helpers.Coord, radius: number): Answer[] {
        return categorizeBinary(
            turf.distance(center, this.seekers.value) - this.distance.value,
            radius,
            { id: "hit" },
            { id: "miss" },
        );
    }

    override divideArea(extent: BBox): FeatureCollection<Area, Answered> | null {
        const hit = turf.bboxClip(
            turf.circle(this.seekers.value, this.distance.value, { steps: 512 }),
            extent,
        );
        if (!isArea(hit)) return soleDivision(extent, { id: "miss" });

        const miss = turf.difference(turf.featureCollection<Area>([turf.bboxPolygon(extent), hit]));
        if (miss === null) return soleDivision(extent, { id: "hit" });

        return turf.featureCollection([
            { ...hit, properties: { id: "hit", answer: { id: "hit" } } },
            { ...miss, properties: { id: "miss", answer: { id: "miss" } } },
        ]);
    }
}
