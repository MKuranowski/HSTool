// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as z from "zod";

/**
 * Creates a [zod Codec](https://zod.dev/codecs) that converts between JSON strings
 * and the provided schema.
 */
export default function zodJson<T extends z.ZodType>(schema: T) {
    return z.codec(z.string(), schema, {
        decode(value, ctx) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(value);
            } catch (err) {
                ctx.issues.push({
                    code: "invalid_format",
                    format: "json",
                    input: value,
                    // @ts-expect-error "message" does not exist on {}, duh, that's what `?.` is for
                    message: err?.message as string,
                });
                return z.NEVER;
            }
        },

        encode(value) {
            return JSON.stringify(value);
        },
    });
}
