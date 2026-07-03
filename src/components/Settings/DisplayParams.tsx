// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import { Dropdown, DropdownButton, InputGroup } from "react-bootstrap";
import { BaseMapStyle, baseMapStyles } from "../../model/preferences.ts";
import $ from "../../state.ts";
import BooleanSetting from "./common/BooleanSetting.tsx";
import NumberSetting from "./common/NumberSetting.tsx";

function ShowHidingZonesInput() {
    return (
        <BooleanSetting
            label="Show hiding zones"
            signal={$.preferences.showHidingZones}
            className="mb-2"
        />
    );
}

function ShowMapDivisionsInput() {
    return (
        <BooleanSetting
            label="Show map divisions"
            signal={$.preferences.showMapDivisions}
            className="mb-2"
        />
    );
}

function baseMapName(style: BaseMapStyle): string {
    switch (style) {
        case "osm-carto":
            return "OpenStreetMap Carto";
        case "carto-voyager":
            return "CARTO Voyager";
        case "carto-light":
            return "CARTO Light";
        case "carto-dark":
            return "CARTO Dark";
    }
}

function BaseMapSelect() {
    useSignals();
    const selected = $.preferences.baseMapStyle.value;

    return (
        <InputGroup className="justify-content-center mb-2">
            <InputGroup.Text>Base map style</InputGroup.Text>
            <DropdownButton id="setting-base-map" variant="secondary" title={baseMapName(selected)}>
                {baseMapStyles.map((style) => (
                    <Dropdown.Item
                        key={style}
                        onClick={() => {
                            $.preferences.baseMapStyle.value = style;
                        }}
                    >
                        {baseMapName(style)}
                    </Dropdown.Item>
                ))}
            </DropdownButton>
        </InputGroup>
    );
}

function CirclePrecisionInput() {
    return (
        <NumberSetting
            label="Circle precision"
            signal={$.preferences.circlePrecision}
            min={3}
            step={1}
            integer
            unit="steps"
        />
    );
}

export default function DisplayParams() {
    return (
        <>
            <ShowHidingZonesInput />
            <ShowMapDivisionsInput />
            <BaseMapSelect />
            <CirclePrecisionInput />
        </>
    );
}
