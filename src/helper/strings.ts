// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

export function toString(obj: unknown): string {
    if (obj === null) {
        return "null";
    } else if (obj === undefined) {
        return "undefined";
    } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return obj.toString();
    }
}
