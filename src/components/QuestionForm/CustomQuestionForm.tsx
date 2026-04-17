// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Form, InputGroup } from "react-bootstrap";
import { getQuestionState } from "../../helper/ui";
import * as CustomQuestion from "../../model/Question/CustomQuestion";
import CommonButtons from "./common/CommonButtons";

export default function CustomQuestionForm({
    q,
    index,
}: {
    q: CustomQuestion.T;
    index: number | null;
}) {
    const [, getQuestion, setQuestion] = getQuestionState(index);
    return (
        <>
            <InputGroup className="mb-2">
                <InputGroup.Text>Name</InputGroup.Text>
                <Form.Control
                    type="text"
                    value={q.name}
                    onChange={(e) => {
                        const q = getQuestion();
                        if (q && q.kind === "custom") {
                            setQuestion({ ...q, name: e.target.value });
                        }
                    }}
                />
            </InputGroup>
            <InputGroup className="mb-2">
                <InputGroup.Text>Answer</InputGroup.Text>
                <Form.Control
                    type="text"
                    value={q.answer}
                    onChange={(e) => {
                        const q = getQuestion();
                        if (q && q.kind === "custom") {
                            setQuestion({ ...q, answer: e.target.value });
                        }
                    }}
                />
            </InputGroup>
            <CommonButtons index={index} />
        </>
    );
}
