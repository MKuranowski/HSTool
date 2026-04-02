// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import { Col, Container, Row, Tab, Tabs } from "react-bootstrap";
import Map from "./Map";
import Settings from "./Settings";
import ToastManager from "./ToastManager";
import Stations from "./Stations";

function App() {
    return (
        <>
            <ToastManager />
            <Container fluid>
                <Row className="my-1 gy-1">
                    <Col md={8}>
                        <Map />
                    </Col>
                    <Col md={4}>
                        <Tabs defaultActiveKey="questions">
                            <Tab eventKey="questions" title="Questions">
                                Lorem ipsum dolor sit amet.
                            </Tab>
                            <Tab eventKey="stations" title="Stations">
                                <Stations />
                            </Tab>
                            <Tab eventKey="settings" title="Settings">
                                <Settings />
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default App;
