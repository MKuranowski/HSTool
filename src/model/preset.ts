// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch, Signal } from "@preact/signals-react";
import type {
    FeatureCollection,
    Geometry,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson";
import type { Area } from "./geo.ts";
import type { Identified, Named } from "./props.ts";

type CandidateSets<G extends Geometry> = Record<string, FeatureCollection<G, Identified>>;
type SensibleGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

interface FullPresetParams {
    name: string;
    hidingRadius: number;
    answerTime: number;
    photoAnswerTime: number;
    quickAnswerMultiplier: number;
    stations: FeatureCollection<Point, Named>;
    points: CandidateSets<Point>;
    lines: CandidateSets<LineString>;
    areas: CandidateSets<Area>;
    overlay: FeatureCollection<SensibleGeometry>;
}

const emptyPreset: FullPresetParams = {
    name: "(empty)",
    hidingRadius: 0.5,
    answerTime: 5,
    photoAnswerTime: 10,
    quickAnswerMultiplier: 0,
    stations: { type: "FeatureCollection", features: [] },
    points: {},
    lines: {},
    areas: {},
    overlay: { type: "FeatureCollection", features: [] },
} as const;

export type PresetParams = Partial<FullPresetParams>;

function fillParams(p: PresetParams, fallback: FullPresetParams = emptyPreset): FullPresetParams {
    return Object.assign({ ...fallback }, p);
}

export default class Preset {
    /** User-facing name identifying the preset */
    readonly name: Signal<string>;

    /** Hiding radius around each station, in kilometers */
    readonly hidingRadius: Signal<number>;

    /** How much time hiders have to answer a question? In minutes. */
    readonly answerTime: Signal<number>;

    /** How much time hiders have to answer a photo question? In minutes. */
    readonly photoAnswerTime: Signal<number>;

    /** Multiplier for extra time bonus awarded for quick answers. */
    readonly quickAnswerMultiplier: Signal<number>;

    /** Collections of stations - valid hiding zone roots/centers */
    readonly stations: Signal<FeatureCollection<Point, Named>>;

    /** Candidate sets for questions using points - match-point, measure and tentacles. */
    readonly points: Signal<CandidateSets<Point>>;

    /** Candidate sets for questions using lines - measure. */
    readonly lines: Signal<CandidateSets<LineString>>;

    /** Candidate sets for questions using areas - match-area. */
    readonly areas: Signal<CandidateSets<Area>>;

    /**
     * Permanent overlay to be drawn immediately above map tiles,
     * like transit lines available during the game.
     *
     * Features may be styled using [simplestyle](https://github.com/mapbox/simplestyle-spec).
     * Point-like features are currently not displayed.
     */
    readonly overlay: Signal<FeatureCollection<SensibleGeometry>>;

    constructor(p: PresetParams = {}) {
        const f = fillParams(p);
        this.name = new Signal(f.name);
        this.hidingRadius = new Signal(f.hidingRadius);
        this.answerTime = new Signal(f.answerTime);
        this.photoAnswerTime = new Signal(f.photoAnswerTime);
        this.quickAnswerMultiplier = new Signal(f.quickAnswerMultiplier);
        this.stations = new Signal(f.stations);
        this.points = new Signal(f.points);
        this.lines = new Signal(f.lines);
        this.areas = new Signal(f.areas);
        this.overlay = new Signal(f.overlay);
    }

    update(p: PresetParams): void {
        const f = fillParams(p);
        batch(() => {
            this.name.value = f.name;
            this.hidingRadius.value = f.hidingRadius;
            this.answerTime.value = f.answerTime;
            this.photoAnswerTime.value = f.photoAnswerTime;
            this.quickAnswerMultiplier.value = f.quickAnswerMultiplier;
            this.stations.value = f.stations;
            this.points.value = f.points;
            this.lines.value = f.lines;
            this.areas.value = f.areas;
            this.overlay.value = f.overlay;
        });
    }

    toJSON(): FullPresetParams {
        return {
            name: this.name.value,
            hidingRadius: this.hidingRadius.value,
            answerTime: this.answerTime.value,
            photoAnswerTime: this.photoAnswerTime.value,
            quickAnswerMultiplier: this.quickAnswerMultiplier.value,
            stations: this.stations.value,
            points: this.points.value,
            lines: this.lines.value,
            areas: this.areas.value,
            overlay: this.overlay.value,
        };
    }
}
