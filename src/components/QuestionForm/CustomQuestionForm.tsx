// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { useSignals } from "@preact/signals-react/runtime";
import { Form, InputGroup } from "react-bootstrap";
import { type CustomQuestion } from "../../model/question/index.ts";
import CommonButtons from "./common/CommonButtons.tsx";

export default function CustomQuestionForm({
    q,
    index,
}: {
    q: CustomQuestion;
    index: number | null;
}) {
    useSignals();
    return (
        <>
            <InputGroup className="mb-2">
                <InputGroup.Text>Name</InputGroup.Text>
                <Form.Control
                    type="text"
                    value={q.name.value}
                    onChange={(e) => {
                        q.name.value = e.target.value;
                    }}
                />
            </InputGroup>
            <InputGroup className="mb-2">
                <InputGroup.Text>Answer</InputGroup.Text>
                <Form.Control
                    type="text"
                    value={q.answer.value}
                    onChange={(e) => {
                        q.answer.value = e.target.value;
                    }}
                />
            </InputGroup>
            <CommonButtons q={q} index={index} />
        </>
    );
}
