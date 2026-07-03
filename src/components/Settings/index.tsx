// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import DisplayParams from "./DisplayParams.tsx";
import PresetInput from "./PresetInput.tsx";
import PresetParams from "./PresetParams.tsx";

export default function Settings() {
    return (
        <>
            <PresetParams />
            <hr />
            <DisplayParams />
            <hr />
            <PresetInput />
        </>
    );
}
