// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { OverlayTrigger, Tooltip } from "react-bootstrap";
import $ from "../../state.ts";
import NumberSetting from "./common/NumberSetting.tsx";

function PhotoAnswerTimeInput() {
    const label = (
        <>
            Photo question answer time
            <OverlayTrigger
                flip
                overlay={
                    <Tooltip id="photo-answer-time">
                        Any custom question with the word &quot;photo&quot;
                    </Tooltip>
                }
            >
                <i className="bi bi-question-circle ps-1" />
            </OverlayTrigger>
        </>
    );

    return (
        <NumberSetting
            label={label}
            signal={$.preset.photoAnswerTime}
            min={0}
            step={1}
            unit="min"
            className="mb-2"
        />
    );
}

function AnswerTimeInput() {
    return (
        <NumberSetting
            label="Other question answer time"
            signal={$.preset.answerTime}
            min={0}
            step={1}
            unit="min"
            className="mb-2"
        />
    );
}

function QuickAnswerMultiplierInput() {
    const label = (
        <>
            Quick answer multiplier
            <OverlayTrigger
                flip
                overlay={
                    <Tooltip id="quick-answer-multiplier">
                        Bonus time added to the hiding time for quick answering questions,
                        calculated by truncating the answer time multiplied by this factor. For
                        example, when set to 0.5, if the hider answers a photo question with 5
                        minutes leftover, (⌊5*0.5⌋=⌊2.5⌋=) 2 minutes will be added to their hiding
                        time. Set to 0 to disable.
                    </Tooltip>
                }
            >
                <i className="bi bi-question-circle ps-1" />
            </OverlayTrigger>
        </>
    );

    return (
        <NumberSetting
            label={label}
            signal={$.preset.quickAnswerMultiplier}
            min={0}
            step={0.1}
            className="mb-2"
        />
    );
}

function HidingZoneRadiusInput() {
    return (
        <NumberSetting
            label="Hiding zone radius"
            signal={$.preset.hidingRadius}
            min={0}
            step={0.1}
            unit="km"
        />
    );
}

export default function PresetParams() {
    return (
        <>
            <PhotoAnswerTimeInput />
            <AnswerTimeInput />
            <QuickAnswerMultiplierInput />
            <HidingZoneRadiusInput />
        </>
    );
}
