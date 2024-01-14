import { collection, getDocs, where, query, addDoc, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Button, Container, Table, Spinner, Modal, Form, Row, Col, Dropdown } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const getData = async (type,flatNo, userType) => {
    var maintenanceData = [];
    try{
        const collectionRef = collection(firestore, "Maintenance");
        var q = null;
        if(userType === "admin") {
            q = query(collectionRef, 
                where("type", "==",type));
        }else{
            q = query(collectionRef, 
                        where("type", "==",type), 
                        where("flatNo","==",parseInt(flatNo)));
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            maintenanceData.push({id:doc.id,data:doc.data()});
        });
        
    }catch(e){
        console.log(e);
    }finally{
        return maintenanceData;
    }
}

const getAnnouncements = async () => {
    var announcementData = [];
    try{
        const collectionRef = collection(firestore, "Announcements");
        const q = query(collectionRef);
        const querySnapshot = await getDocs(q);
        console.log("got snapshot");
        querySnapshot.forEach((doc) => {
            announcementData.push(doc.data());
        });
        console.log("announcements",announcementData);
        
    }catch(e){
        console.log(e);
    }finally{
        return announcementData;
    }
}

export function Announcements(){
    const [announcementData,setAnnouncementData] = useState([]);
    const [isLoading,setIsLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getAnnouncements();
            setAnnouncementData(data);
            setIsLoading(false);
        };
    
        fetchData();
      }, []);
    console.log(announcementData);
    return(
        <Container fluid className="justify-content-center align-items-center" style={{ height: '550px', backgroundColor: 'lightgray'}}>
            <Table striped bordered hover size='lg'>
                <thead>
                    <tr>
                        <th>Announcement</th>
                        <th>Date</th>
                    </tr>
                </thead>
                {isLoading ? (
                <tbody>
                    <tr>
                        <td colSpan={5}><CenteredSpinner /></td>
                    </tr>
                </tbody>
                ) : (
                <tbody>
                    {announcementData.map((announcement) => (
                        <tr>
                            <td>{announcement.message}</td>
                            <td>{announcement.date}</td>
                        </tr>
                    ))}
                </tbody>)}
            </Table>
        </Container>
    )
};

export const CenteredSpinner = () => {
    return (
        <div style={{textAlign:"center"}}>
            <Spinner animation="border" variant="success" style={{width:"60px", height:"60px"}}  />
        </div>
    )
}

function PayExpenseModal(props){
    const [isLoading, setIsLoading] = useState(false);
    console.log("Record",props.record);
    const modRef = useRef(null);
    const handleSavePayExpense = async() => {
        try{
            setIsLoading(true);
            const docRef = doc(firestore, 'Maintenance', props.record.id);
            await updateDoc(docRef, { paid: "paid",adminAcceptance:"requested",
                                    mod:modRef.current.value });
            setIsLoading(false);
            props.onHidePayExpenseModal();
            toast.success("Request for payment approval send successfully");
            props.setCount((x)=>x+1);
        }catch(e){
            console.log(e);
        }
    }

    return(
        <div>
            <Modal
                show={props.showPayExpenseModal}
                onHide={props.onHidePayExpenseModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                <h2>Pay Expense</h2>
                </Modal.Title>
            </Modal.Header> 
            {isLoading && <CenteredSpinner />}
            <Modal.Body>
                    <Container>
                        <Table>
                            <tr>
                                <th>Amount</th>
                                <th>Flat Number</th>
                                <th>Type</th>
                                <th>Date</th>
                            </tr>
                            {props.record?
                                (<tr>
                                    <td>{props.record.data.amount}</td>
                                    <td>{props.record.data.flatNo}</td>
                                    <td>{props.record.data.type}</td>
                                    <td>{props.record.data.month.substring(0,3)}-{props.record.data.year}</td>
                                </tr>): (<tr></tr>)}
                        </Table>
                        <Form>
                            <Form.Label>Mode of Payment</Form.Label>
                            <Form.Select name="mod" id="mod" ref={modRef}>
                                <option value="Cash">Cash</option>
                                <option value="Online">Online Payment</option>
                            </Form.Select>
                        </Form>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                <Button variant='danger' size='lg' onClick={handleSavePayExpense}>Save</Button>    
                <Button variant='danger' size='lg' onClick={props.onHidePayExpenseModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export function Records(props){
    const [recordData, setRecordData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [record, setRecord] = useState(null);
    const [showPayExpenseModal,setShowPayExpenseModal] = useState(false);
    const [count,setCount] = useState(0);

    const handlePayExpense = (rec) => {
        setRecord(rec);
        setShowPayExpenseModal(true);
    }

    const handleDeleteExpense = (rec) => {

    }


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getData(props.type, props.flatNo, props.userType);
            setRecordData(data);
            setIsLoading(false);
        };
    
        fetchData();
      }, [props.type,props.flatNo,props.userType, count]);
    return(
        <Container fluid className="justify-content-center align-items-center" style={{ height: '550px', backgroundColor: 'lightgray'}}>
            <PayExpenseModal onHidePayExpenseModal={()=>setShowPayExpenseModal(false)}
            record={record} showPayExpenseModal={showPayExpenseModal} setCount={setCount}
            />
            <Table striped bordered hover size='lg'>
                <thead>
                    <tr>
                        <th>Bill Type</th>
                        <th>Flat Number</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Paid</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                {isLoading ? (
                <tbody>
                    <tr>
                        <td colSpan={7}><CenteredSpinner/></td>
                    </tr>
                </tbody>
                ) : (
                <tbody>
                    {recordData.map((record) => (
                        <tr key={record.id}>
                            <td>{record.data.type}</td>
                            <td>{record.data.flatNo}</td>
                            <td>{record.data.amount}</td>
                            <td>{record.data.month.substring(0,3)}-{record.data.year}</td>
                            <td>{record.data.paid}</td>
                            <td>{record.data.adminAcceptance}</td>
                            <td>
                            {(record.data.paid === "paid")?(
                                <Button variant='success' disabled>Pay Now</Button>
                            ):(
                                <Button variant='success' onClick={() => handlePayExpense(record)}>Pay Now</Button>
                            )}
                            {props.userType === "admin" && (
                                <>
                                    <span style={{ marginLeft: '10px' }}></span>
                                    <Button variant='danger' onClick={() => handleDeleteExpense(record)}>Delete</Button>
                                </>
                            )}
                            </td>
                            
                        </tr>
                    ))}
                </tbody>)}
            </Table>
        </Container>
    )
}

export function InvalidType(){
    

    return(
        <div>Invalid Selection</div>
    )
}

const addToDb = async (recordToAdd) =>{
    var flatNoRecord = [];
    try{
        const collectionRef = collection(firestore, "userData");
        const q = query(collectionRef, 
            where("flatNo", "==", parseInt(recordToAdd['flatNo'])));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            flatNoRecord.push(doc.data());
        });
    }catch(e){
        console.log(e);
    }
    if(flatNoRecord.length === 0){
        console.log("Flat number does not exist",recordToAdd["flatNo"]);
        return recordToAdd["flatNo"];
    }else{
        recordToAdd['paid'] = "unpaid";
        recordToAdd['mod'] = "";
        recordToAdd['adminAcceptance'] = "";
        recordToAdd['flatNo'] = parseInt(recordToAdd['flatNo']);
        recordToAdd['amount'] = parseInt(recordToAdd['amount']);
        try{
            await addDoc(collection(firestore,'Maintenance'),recordToAdd);
            console.log("Document added to Db");
        }catch(e){
            console.log(e);
        }
    }
}

function InputModal(props){
    const formRef = useRef(null);
    var recordsNotAdded = [];
    var formElements = {};
    var notAddedRecord = null;

    const [isLoading,setIsLoading] = useState(false);

    const saveRecord = async () => {
        setIsLoading(true);
        if (formRef.current) {
            const formElementsArray = Array.from(formRef.current.elements);
            formElements = formElementsArray.reduce((elements, element) => {
                elements[element.name] = element.value;
                return elements;
              }, {});
            console.log(formElements);
            notAddedRecord = await addToDb(formElements);
            if(notAddedRecord){recordsNotAdded.push(notAddedRecord);}
          } else {
            console.error('Form not found.');
          }
        props.onHideInputModal();
        if(notAddedRecord){
            toast.info("Added data Partially. Data not added for flat no:"+JSON.stringify(recordsNotAdded));
        }else{
            toast.success("Added data successfully");
        }
        setIsLoading(false);
    }
    return(
        <div>
            <Modal
          show={props.showInputModal}
          onHide={props.onHideInputModal}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Add Expense
            </Modal.Title>
          </Modal.Header>
          {isLoading && <CenteredSpinner />}
          <Modal.Body>
            <Row>
                <Col>
                    <Form ref={formRef}>
                        <Form.Label>Type</Form.Label>
                        <Form.Select id='type' name='type'>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Water">Water</option>
                        </Form.Select>
                        <Form.Label>Amount</Form.Label>
                        <Form.Control type='number' id='amount' name='amount'/>
                        <Form.Label>Month</Form.Label>
                        <Form.Select id='month' name='month'>
                            <option value="January">January</option>
                            <option value="February">February</option>
                            <option value="March">March</option>
                            <option value="April">April</option>
                            <option value="May">May</option>
                            <option value="June">June</option>
                            <option value="July">July</option>
                            <option value="August">August</option>
                            <option value="September">September</option>
                            <option value="October">October</option>
                            <option value="November">November</option>
                            <option value="December">December</option>
                        </Form.Select>
                        <Form.Label>Year</Form.Label>
                        <Form.Control type='number' id='year' name='year'/>
                        <Form.Label>Flat Number</Form.Label>
                        <Form.Control type="number" id='flatNo' name="flatNo" />
                    </Form>
                </Col>
            </Row>
            <hr />
            <Row style={{textAlign:"center"}}>
                <Col>
                    <h3>OR</h3>
                </Col>
            </Row>
            </Modal.Body>
            <Modal.Footer>
                <div><h6>Add from an excel File</h6></div>
                <div>
                <ExcelReader onHideInputModal={props.onHideInputModal} 
                onShowConfirmationModal={props.onShowConfirmationModal}
                setExcelData={props.setExcelData}
                excelData={props.excelData}
                />
                </div>
                <Button size='lg' onClick={saveRecord}>Save</Button>
            </Modal.Footer>
        </Modal>
        </div>
    )
}

export function AddExpense(props){
    const [excelData, setExcelData] = useState(null);
    return (
        <div>
            <InputModal showInputModal={props.showInputModal} 
                onHideInputModal={props.onHideInputModal}
                onShowConfirmationModal={props.onShowConfirmationModal}
                setExcelData={setExcelData}
                excelData={excelData}
            />
            <ConfirmationModal showConfirmationModal={props.showConfirmationModal} 
                onHideConfirmationModal={props.onHideConfirmationModal}
                excelData={excelData}
            />
        </div>
      );
}

const ExcelReader = (props) => {
    
    
    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
    
        // Read the Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
        
            // Assuming there is only one sheet in the Excel file
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
        
            // Convert sheet data to JSON
            const jsonData = XLSX.utils.sheet_to_json(sheet);
        
            // Store the data in variables or state
            if(jsonData){
                props.setExcelData(jsonData);
                props.onHideInputModal();
                props.onShowConfirmationModal();
            }else{
                toast.danger("No Data Found");
            }
        };
        
        reader.readAsArrayBuffer(file);
    };
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
    
    return (
        <div>
            <div {...getRootProps()} style={dropzoneStyle}>
                <input {...getInputProps()} />
                {isDragActive ? <p>Drop the Excel file here...</p> : <p>Drag 'n' drop an Excel file here, or click to select one</p>}
            </div>
        </div>
    );
}

function ConfirmationModal(props){
    const [isLoading,setIsLoading] = useState(false);

    const saveExcelData = async () => {
        setIsLoading(true);
        var recordsNotAdded = [];
        var flatNo = null;
        console.log("Excel Data",props.excelData);
        for(var i=0;i<props.excelData.length;i++){
            flatNo = await addToDb(props.excelData[i]);
            if(flatNo){recordsNotAdded.push(flatNo);}
        }
        if(recordsNotAdded.length > 0 ){
            toast.info("Added Excel data\n Data not added for flat no:"+JSON.stringify(recordsNotAdded));
        }else{
            toast.success("Added Excel data");
        }
        setIsLoading(false);
        props.onHideConfirmationModal();
    }
    return(
        <Modal
            show={props.showConfirmationModal}
            onHide={props.onHideConfirmationModal}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              <h2>Confirm the data from Excel</h2>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Container>
            <pre>{JSON.stringify(props.excelData, null, 2)}</pre>
            </Container>
            </Modal.Body>
            {isLoading && <CenteredSpinner />}
            <Modal.Footer>
            <Button size='lg' onClick={saveExcelData}>Save</Button>
            </Modal.Footer>
        </Modal>
    )
}

const dropzoneStyle = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
  };


function AboutModal(props){
    return(
        <Modal
            show={props.showAboutModal}
            onHide={props.onHideAboutModal}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              <h2>About</h2>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
                <Container>
                    <h5>This is an Apartment Management App</h5>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <Button size='lg' onClick={props.onHideAboutModal}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

function PendingRequestsModal(props){
    const getPendingRequests = async () => {
        var pendingRequests = [];
        try{
            const collectionRef = collection(firestore, "userData");
            const q = query(collectionRef,
                        where("status","==","requested"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                pendingRequests.push({id:doc.id,data:doc.data()});
            });
            
        }catch(e){
            console.log(e);
        }finally{
            return pendingRequests;
        }
    }

    const [pendingRequestsData, setPendingRequestsData] = useState([]);
    const [rerunEffect, setRerunEffect] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getPendingRequests();
            setPendingRequestsData(data);
            setIsLoading(false);
        };
        fetchData();
      }, [rerunEffect]);

    const handleAcceptRequest = async (id) => {
        try{
            setIsLoading(true);
            const docRef = doc(firestore, 'userData', id);
            await updateDoc(docRef, { status: "accepted" });
            setRerunEffect(!rerunEffect);
            setIsLoading(false);
        }catch(e){
            console.log(e);
        }
    }

    const handleRejectRequest = async (id) => {
        try{
            setIsLoading(true);
            const docRef = doc(firestore, 'userData', id);
            await updateDoc(docRef, { status: "rejected" });
            setRerunEffect(!rerunEffect);
            setIsLoading(false);
        }catch(e){
            console.log(e);
        }
    }
    
    return(
        <div>
            <Modal
                show={props.showPendingRequestsModal}
                onHide={props.onHidePendingRequestsModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                <h2>Pending Requests</h2>
                </Modal.Title>
            </Modal.Header> 
            {isLoading && <CenteredSpinner />}
            <Modal.Body>
                    <Container>
                        <Table striped hover bordered responsive>
                            <thead>
                                <tr>
                                    <th>Mobile Number</th>
                                    <th>Name</th>
                                    <th>Flat No</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                { pendingRequestsData.map((request)=>(
                                    <tr key={request.id}>
                                        <td>{request.data.mobileNo}</td>
                                        <td>{request.data.name}</td>
                                        <td>{request.data.flatNo}</td>
                                        <td><Button onClick={() => handleAcceptRequest(request.id)}>Accept</Button>
                                            <Button variant='danger' onClick={() => handleRejectRequest(request.id)}>Reject</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                <Button variant='danger' size='lg' onClick={props.onHidePendingRequestsModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

function PaymentRequestsModal(props){
    const [paymentRequestsData, setPaymentRequestsData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rerunEffect, setRerunEffect] = useState(false);

    const getPaymentsRequests = async () => {
        var paymentRequests = [];
        try{
            const collectionRef = collection(firestore, "Maintenance");
            const q = query(collectionRef,
                        where("paid","==","paid"),
                        where("adminAcceptance","==","requested"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                paymentRequests.push({id:doc.id,data:doc.data()});
            });
            console.log("paymentRequests",paymentRequests);
            
        }catch(e){
            console.log(e);
        }finally{
            return paymentRequests;
        }
    }

    const handleAcceptPaymentRequest = async(id) => {
        try{
            setIsLoading(true);
            const docRef = doc(firestore, 'Maintenance', id);
            await updateDoc(docRef, { adminAcceptance: "Accepted" });
            setRerunEffect(!rerunEffect);
            setIsLoading(false);
        }catch(e){
            console.log(e);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getPaymentsRequests();
            setPaymentRequestsData(data);
            setIsLoading(false);
        };
        fetchData();
      }, [rerunEffect]);

    return(
        <div>
            <Modal
                show={props.showPaymentRequestsModal}
                onHide={props.onHidePaymentRequestsModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                <h2>Payment Requests</h2>
                </Modal.Title>
            </Modal.Header> 
            {isLoading && <CenteredSpinner />}
            <Modal.Body>
                    <Container>
                        <Table striped hover bordered responsive>
                            <thead>
                                <tr>
                                    <th>Flat Number</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Mode of Payment</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                { paymentRequestsData.map((request)=>(
                                    <tr key={request.id}>
                                        <td>{request.data.flatNo}</td>
                                        <td>{request.data.flatNo}</td>
                                        <td>{request.data.type}</td>
                                        <td>{request.data.amount}</td>
                                        <td>{request.data.mod}</td>
                                        <td>{request.data.month.substring(0,3)}-{request.data.year}</td>
                                        <td><Button onClick={() => handleAcceptPaymentRequest(request.id)}>Accept</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                <Button variant='danger' size='lg' onClick={props.onHidePaymentRequestsModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export function Menu(props){
    const [showAboutModal,setShowAboutModal] = useState(false);
    const [showPendingRequestsModal,setShowPendingRequestsModal] = useState(false);
    const [showPaymentRequestsModal,setShowPaymentRequestsModal] = useState(false);
    const navigate = useNavigate();
    const handleLogout = () => {
        navigate('/',);
    }
    return(
        <div className='w-100 h-100'>
            <AboutModal showAboutModal={showAboutModal}
            onHideAboutModal={()=>setShowAboutModal(false)}
            />
            {props.userType === "admin" &&
            <PendingRequestsModal showPendingRequestsModal={showPendingRequestsModal}
            onHidePendingRequestsModal={()=>setShowPendingRequestsModal(false)}
            />}
            {props.userType === "admin" &&
            <PaymentRequestsModal showPaymentRequestsModal={showPaymentRequestsModal}
            onHidePaymentRequestsModal={()=>{setShowPaymentRequestsModal(false)}}
            />}
            <Dropdown className='h-100' drop='down-centered'>
                    <Dropdown.Toggle className='w-100 h-100'
                        variant="outline-info" id="dropdown-basic">
                        Menu
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                    {props.userType === "admin" &&
                    <Dropdown.Item onClick={()=> setShowPaymentRequestsModal(true)}>Payment Requests</Dropdown.Item>}
                    {props.userType === "admin" &&
                    <Dropdown.Item onClick={()=> setShowPendingRequestsModal(true)}>Pending Requests</Dropdown.Item>}
                    <Dropdown.Item onClick={()=> setShowAboutModal(true)}>About</Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout}>Log out</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}
