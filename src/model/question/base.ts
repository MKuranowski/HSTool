// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { batch, type ReadonlySignal, Signal } from "@preact/signals-react";
import type { Coord } from "@turf/turf";
import type { BBox, Feature, FeatureCollection, Point } from "geojson";
import * as uuid from "uuid";
import type { Area } from "../geo.ts";
import type { Answer, Answered, WithPossibleAnswers } from "../props.ts";
import Timestamp from "../timestamp.ts";

/** Constructor parameters used by the abstract {@link BaseQuestion} class. */
export interface BaseQuestionParams {
    id?: string | undefined;
    askedAt?: Timestamp | undefined;
    answeredAt?: Timestamp | undefined;
    inEndGame?: boolean | undefined;
    answer?: string;
}

/**
 * Base class for all questions which can be asked during the game.
 */
export default abstract class BaseQuestion {
    /** UUIDv7 uniquely identifying this Question. */
    readonly id: string;

    /** What was the question to this answer? */
    readonly answer: Signal<string | undefined>;

    /** When was this question asked? */
    readonly askedAt: Signal<Timestamp | undefined>;

    /** When was this question answered? */
    readonly answeredAt: Signal<Timestamp | undefined>;

    /** Was this question asked during the end game? */
    readonly inEndGame: Signal<boolean>;

    constructor(p: BaseQuestionParams = {}) {
        this.id = p.id ?? uuid.v7();
        this.answer = new Signal(p.answer);
        this.askedAt = new Signal(p.askedAt);
        this.answeredAt = new Signal(p.answeredAt);
        this.inEndGame = new Signal(!!p.inEndGame);
    }

    /** ID uniquely identifying a concrete question type. */
    abstract get kind(): string;

    /** Short, user-facing name of this question. */
    abstract get name(): ReadonlySignal<string>;

    /** List of all possible answers to this question. */
    abstract get answers(): ReadonlySignal<readonly string[]>;

    /**
     * Validate and update the {@link answer} to this question, and {@link answeredAt} as appropriate.
     */
    setAnswer(answer: string | undefined): void {
        if (
            answer !== undefined && this.answers.value.length > 0 &&
            !this.answers.value.includes(answer)
        ) {
            throw new Error(
                `invalid answer: got ${answer}, expected one of: ${this.answers.value.join(", ")}`,
            );
        }

        batch(() => {
            this.answer.value = answer;
            if (answer === undefined) {
                // Remove answeredAt only if it's not marked as explicit.
                if (this.answeredAt.value && !this.answeredAt.value.explicit.value) {
                    this.answeredAt.value = undefined;
                }
            } else if (this.answeredAt.value === undefined) {
                this.answeredAt.value = new Timestamp();
            } else {
                this.answeredAt.value.update();
            }
        });
    }

    /**
     * Toggles the {@link inEndGame} flag.
     */
    toggleInEndGame() {
        this.inEndGame.value = !this.inEndGame.peek();
    }

    /**
     * What are the possible answers for someone at this hiding zone?
     *
     * @param center center of the hiding zone
     * @param radius radius of the hiding zone, in kilometers
     * @returns all possible answers
     */
    categorize(_center: Coord, _radius: number): Answer[] {
        return [];
    }

    /**
     * Returns a copy of this GeoJSON Point Feature, with its `possibleAnswers` property
     * set to the result of {@link categorize}.
     *
     * @param f feature representing center of the hiding zone
     * @param radius radius of the hiding zone, in kilometers
     * @returns copy of the feature with an extra `possibleAnswers` property
     */
    categorizeFeature<P extends object>(
        f: Feature<Point, P>,
        radius: number,
    ): Feature<Point, P & WithPossibleAnswers> {
        const possibleAnswers = this.categorize(f, radius);
        return { ...f, properties: { ...f.properties, possibleAnswers } };
    }

    /**
     * Returns a copy of this GeoJSON Point FeatureCollection, with every feature's
     * `possibleAnswers` property set to the result of {@link categorize}.
     *
     * @param c feature collection of hiding zone centers
     * @param radius radius of every hiding zone, in kilometers
     * @returns copy of the feature collection, with possibleAnswers properties
     */
    categorizeFeatures<P extends object>(
        c: FeatureCollection<Point, P>,
        radius: number,
    ): FeatureCollection<Point, P & WithPossibleAnswers> {
        return {
            ...c,
            features: c.features.map((f) => this.categorizeFeature(f, radius)),
        };
    }

    /**
     * Computes an approximate division of the provided bounding box into areas covered
     * by each [answer]{@link answers}; such that if a hider was in a particular area,
     * they would have to respond with the corresponding answer.
     *
     * Areas must not overlap. However, callers must **not** assume that
     * ~~`features[i] == answers[i]`~~. The returned features can be in any order, and
     * there may be from 0 to N features corresponding to one answer. Borders between areas with
     * the same answer might also be important to visualize (for example in matching questions),
     * so callers should not union areas with the same answer.
     *
     * This method may return null if the question does not generate geographic-based divisions
     * (such as photo or matching transit line questions). If there's only one possible answer,
     * this method should return one area covering the entire extent.
     *
     * @param extent bounding box to divide
     * @param circlePrecision number of vertices to use when approximating e.g. circles
     * @returns collection of subsets of extent corresponding to a single answer
     */
    divideArea(_extent: BBox, _circlePrecision = 512): FeatureCollection<Area, Answered> | null {
        return null;
    }

    /**
     * Is this question answered correctly for someone hiding at the providing hiding zone?
     *
     * Logically `question.categorize(center, radius).some(a => a.id === q.answer.value)`,
     * but handles questions without specific answers (custom questions) and other edge cases.
     *
     * @param center center of the hiding zone
     * @param radius radius of the hiding zone, in kilometers
     * @returns true if question is answered correctly, fals otherwise
     */
    isAnsweredCorrectly(station: Coord, radius: number): boolean {
        // Question doesn't have a specific set of answers - ignore
        if (this.answers.value.length === 0) return true;

        // No answer - is not answered correctly
        if (this.answer.value === undefined) return false;

        // Check if current answer is in the station's categorization
        return this.categorize(station, radius).some((a) => a.id === this.answer.value);
    }
}
