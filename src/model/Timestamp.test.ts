// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as Timestamp from "./Timestamp";

beforeEach(() => {
    vi.stubEnv("TZ", "Asia/Tokyo");
});

afterEach(() => {
    vi.unstubAllEnvs();
});

test(Timestamp.toFormValue, () => {
    const timestamp = { t: "2026-04-01T08:15:30Z", explicit: true };
    expect(Timestamp.toFormValue(timestamp)).toEqual("2026-04-01T17:15");
});

test(Timestamp.fromFormValue, () => {
    expect(Timestamp.fromFormValue("2026-04-01T17:15")).toStrictEqual({
        t: "2026-04-01T08:15:00.000Z",
        explicit: true,
    });

    expect(() => Timestamp.fromFormValue("Wed, 1 Apr 2026 08:15:30 GMT")).toThrow(
        "Invalid datetime-local input value",
    );
});
