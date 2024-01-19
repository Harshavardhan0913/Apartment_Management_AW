import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { Button, Container } from 'react-bootstrap';
import { Announcements, Records, InvalidType, AddMaintenance, Menu, Expenses } from './utils';


function HomePage(){
    const location = useLocation();
    const stateObject = location.state;
    const [type,setType] = useState("Announcements");
    const [modalShow,setModalShow] = useState(false);
    const [confirmationModalShow,setConfirmationModalShow] = useState(false);
    const [expenseModalShow,setExpenseModalShow] = useState(false);

    const flatNo = stateObject.flatNo;
    const userType = stateObject.userType;

    const handleTypeChange = (event) => {
        setType(event.target.value);
    }
    const showAddMaintenance = () => {
        setModalShow(true);
    }

    const showAddExpense = () => {
        setExpenseModalShow(true);
    }

    return(
        <div>
            <Container fluid style={{ backgroundColor: '#f0f0f0'}} className='overflow-auto'>
            {userType === "admin" &&
                <AddMaintenance 
                showInputModal={modalShow}
                showConfirmationModal={confirmationModalShow}
                onHideInputModal={() => setModalShow(false)} 
                onHideConfirmationModal = {() => setConfirmationModalShow(false)}
                onShowConfirmationModal = {() => setConfirmationModalShow(true)}
                />}
                <Row className='text-center'>
                    <Col>
                    </Col>
                    <Col>
                        <h1>Home Page</h1>
                    </Col>
                    <Col></Col>
                    {userType === "admin" &&
                    <Col>
                        <Button onClick={showAddMaintenance} style={{height:"95%",width:"95%"}}>Add Maintenance</Button>
                    </Col>}
                    {userType === "admin" &&
                    <Col>
                        <Button onClick={showAddExpense} style={{height:"95%",width:"95%"}}>Add Expense</Button>
                    </Col>}
                    <Col>
                        <Menu userType={userType} />
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <Form.Select size="lg" onChange={handleTypeChange}>
                        <option value="Announcements">Announcements</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Water">Water</option>
                        <option value="Expenses">Expenses</option>
                    </Form.Select>
                    </Col>
                </Row>
                <Row>
                    <Col>
                    {
                        type === "Announcements" ? (<Announcements />
                        ) : type === "Maintenance" ? (<Records type={"Maintenance"} flatNo={flatNo} userType={userType} />
                        ) : type === "Water" ? (<Records type={"Water"} flatNo={flatNo} userType={userType} />
                        ) : type === "Expenses" ? (<Expenses expenseModalShow={expenseModalShow} setExpenseModalShow={setExpenseModalShow} userType={userType} />
                        ) : ( <InvalidType /> )
                    }
                        
                    </Col>
                
                </Row>
                
            </Container>
        </div>
        
    );
}

export default HomePage;