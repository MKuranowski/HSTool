// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toString } from "../../../helper/strings.ts";
import { Question } from "../../../model/question/index.ts";
import $ from "../../../state.ts";

export default function DeriveAnswerButton(
    { q, disabled = false }: { q: Question; disabled?: boolean | undefined },
) {
    if (disabled) {
        return (
            <Button variant="primary" disabled>
                <i className="bi bi-crosshair" />
            </Button>
        );
    }

    return (
        <OverlayTrigger overlay={<Tooltip id={`q-${q.id}-derive`}>Derive answer from GPS</Tooltip>}>
            <Button
                variant="primary"
                onClick={() => {
                    $.toast.value = { header: "Getting GPS location", variant: "primary" };
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const hider = [pos.coords.longitude, pos.coords.latitude];

                            // Check if the retrieved position isn't too far
                            const hiderStation = $.hiderStation.peek();
                            if (hiderStation) {
                                const hiderRadius = $.preset.hidingRadius.peek();
                                const distance = round(
                                    turf.distance(hiderStation, hider) - hiderRadius,
                                    0.01, // round to 10 meters
                                );
                                if (distance > 0) {
                                    $.toast.value = {
                                        header: "Failed to derive the answer",
                                        body: `You're ${distance} km outside of the hiding zone`,
                                        variant: "warning",
                                    };
                                    return;
                                }
                            }

                            // Check possible answers
                            const answers = q.categorize(hider, 0);
                            if (answers.length === 0) {
                                $.toast.value = {
                                    header: "Failed to derive the answer",
                                    body: "There are no valid answers at your position",
                                    variant: "warning",
                                };
                            } else if (answers.length > 1) {
                                const names = answers.map((a) =>
                                    `\n- ${a.name ?? a.id}`
                                ).join("");

                                $.toast.value = {
                                    header: "Failed to derive the answer",
                                    body: `There are multiple answers at your position:${names}`,
                                    variant: "warning",
                                };
                            } else {
                                const answer = answers[0];
                                const name = answer.name ?? answer.id;

                                q.setAnswer(answers[0].id);
                                $.toast.value = {
                                    header: "Answer derived successfully",
                                    body: `Answer was updated to:\n${name}`,
                                    variant: "success",
                                };
                            }
                        },
                        (error) => {
                            console.error("Failed to load GPS position:", error);
                            $.toast.value = {
                                header: "Failed to load GPS position",
                                body: toString(error),
                                variant: "danger",
                            };
                        },
                        {
                            maximumAge: 180_000,
                            timeout: 10_000,
                            enableHighAccuracy: true,
                        },
                    );
                }}
            >
                <i className="bi bi-crosshair" />
            </Button>
        </OverlayTrigger>
    );
}

function round(x: number, multiple: number = 1): number {
    return Math.round(x / multiple) * multiple;
}
