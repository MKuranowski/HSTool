// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

/** Anything with a string ID, and maybe a human-readable name. */
export interface Identified {
    id: string;
    name?: string | undefined;
}

/** Anything with a string ID and a name. */
export interface Named {
    id: string;
    name: string;
}

/** An answer to a question - a string ID, and maybe a name - alias for {@link Identified}. */
export type Answer = Identified;

/** Anything with an ID and an answer. */
export interface Answered extends Identified {
    answer: Answer;
}

/** Properties with a couple possible answers. */
export interface WithPossibleAnswers {
    possibleAnswers: Answer[];
}
