import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { Container, Dropdown } from 'react-bootstrap';
import { Announcements, Records, InvalidType, AddMaintenance, Menu, Expenses, AddExpenseModal } from './utils';


function HomePage(){
    const location = useLocation();
    const stateObject = location.state;
    const [type,setType] = useState("Announcements");
    const [modalShow,setModalShow] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [confirmationModalShow,setConfirmationModalShow] = useState(false);
    const [expenseModalShow,setExpenseModalShow] = useState(false);

    const flatNo = stateObject.flatNo;
    const userType = stateObject.userType;

    const handleTypeChange = (event) => {
        setType(event.target.value);
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
                <AddExpenseModal 
                expenseModalShow={expenseModalShow} 
                onHideExpenseModal={()=>setExpenseModalShow(false)}
                refresh={refresh}
                setRefresh={setRefresh}
                />
                <Row className='text-center'>
                    <Col>
                    </Col>
                    <Col>
                        <h1>Home Page</h1>
                    </Col>
                    <Col></Col>
                    <Col>
                    {userType === "admin" &&
                        <Dropdown className='w-100 h-100' drop='down-centered'>
                            <Dropdown.Toggle variant="info" className='w-100 h-100'>
                                Add
                            </Dropdown.Toggle>
                            <Dropdown.Menu className='w-100'>
                                <Dropdown.Item onClick={()=>setExpenseModalShow(true)} >Expense</Dropdown.Item>
                                <Dropdown.Item onClick={()=>setModalShow(true)}>Maintenance</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    }
                    </Col>
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
                        ) : type === "Expenses" ? (<Expenses expenseModalShow={expenseModalShow} setExpenseModalShow={setExpenseModalShow} userType={userType} refresh={refresh} setRefresh={setRefresh} />
                        ) : ( <InvalidType /> )
                    }
                        
                    </Col>
                
                </Row>
                
            </Container>
        </div>
        
    );
}

export default HomePage;