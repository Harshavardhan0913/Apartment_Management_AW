import { collection, getDocs, where, query, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Button, Container, Table, Spinner, Modal, Form, Row, Col, Dropdown } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import _ from 'lodash';

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
        const monthIndexMap = {
            January: 0,
            February: 1,
            March: 2,
            April: 3,
            May: 4,
            June: 5,
            July: 6,
            August: 7,
            September: 8,
            October: 9,
            November: 10,
            December: 11,
          };
          maintenanceData = maintenanceData.sort((a, b) => monthIndexMap[b.data.month] - monthIndexMap[a.data.month]);
          maintenanceData = maintenanceData.sort((a, b) => b.data.year - a.data.year);
          maintenanceData = maintenanceData.sort((a, b) => a.data.flatNo - b.data.flatNo);
        
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
            props.setRefresh((x)=>!x);
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

    const handlePayExpense = (rec) => {
        setRecord(rec);
        setShowPayExpenseModal(true);
    }

    const handleDeleteExpense = async(rec) => {
        try{
            await deleteDoc(doc(collection(firestore,'Maintenance'),rec.id));
            toast.success("Deleted Record Successfully");
            props.setRefresh((x)=>!x);
        }catch(e){
            toast.error(e)
        }
    }


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getData(props.type, props.flatNo, props.userType);
            setRecordData(data);
            setIsLoading(false);
        };
    
        fetchData();
      }, [props.type,props.flatNo,props.userType, props.refresh]);
    return(
        <Container fluid className="justify-content-center align-items-center" style={{ height: '550px', backgroundColor: 'lightgray', textAlign:"center"}}>
            <PayExpenseModal onHidePayExpenseModal={()=>setShowPayExpenseModal(false)}
            record={record} showPayExpenseModal={showPayExpenseModal} setRefresh={props.setRefresh}
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
                            <td>{_.capitalize(record.data.paid)}</td>
                            {(record.data.adminAcceptance!=="")?
                                (<td>{_.capitalize(record.data.adminAcceptance)}</td>):
                                (<td>-</td>)}
                            <td>
                            {(record.data.paid === "paid" || record.data.flatNo !== props.flatNo)?(
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

const addToMaintenanceDb = async (recordToAdd, overrideRecord=false) =>{
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
    const recordExists = async(recordToAdd) => {
        const collectionRef = collection(firestore, "Maintenance");
        const querySnapshot = await getDocs(collectionRef);
        var exists = false;
        var docId = null;
        querySnapshot.forEach((doc) => {
            if(doc.data()["month"] === recordToAdd["month"]
                && doc.data()["year"] === parseInt(recordToAdd["year"])
                && doc.data()["flatNo"] === parseInt(recordToAdd["flatNo"])
                && doc.data()["type"] === recordToAdd["type"]){
                    console.log("true");
                    if(overrideRecord){
                        docId=doc.id;
                    }else{
                        exists = true;
                    }
                }
        });
        if(docId){
            await deleteDoc(doc(collection(firestore,'Maintenance'),docId));
        }
        return exists;
    }
    const validateData = (recordToAdd) => {
        if(recordToAdd["flatNo"] === ""
            || recordToAdd["amount"] === ""
            || recordToAdd["year"] === ""){
            return false;
        }
        return true;
    }
    if(validateData(recordToAdd) === false){
    console.log("Data format incorrect");
    toast.error("Data format incorrect. Skipping...");
    }else if(flatNoRecord.length === 0){
        console.log("Flat number does not exist",recordToAdd["flatNo"]);
        toast.error("Flat number does not exist "+recordToAdd["flatNo"]);
    }else if(await recordExists(recordToAdd) === true){
        console.log("Record already exists",recordToAdd["flatNo"]);
        toast.warning("Record already exists: "+recordToAdd["flatNo"]);
    }else{
        recordToAdd['paid'] = "unpaid";
        recordToAdd['mod'] = "";
        recordToAdd['adminAcceptance'] = "";
        recordToAdd['flatNo'] = parseInt(recordToAdd['flatNo']);
        recordToAdd['amount'] = parseInt(recordToAdd['amount']);
        recordToAdd['year'] = parseInt(recordToAdd['year']);
        try{
            await addDoc(collection(firestore,'Maintenance'),recordToAdd);
            console.log("Document added to Db");
            if(overrideRecord){
                toast.success("Document overwrite successful for flat No: "+recordToAdd["flatNo"]);
            }else{
                toast.success("Document added successfully for flat No: "+recordToAdd["flatNo"]);
            }
        }catch(e){
            console.log(e);
            toast.error(e);
        }
    }
}

function InputModal(props){
    var formElements = {};

    const [isLoading,setIsLoading] = useState(false);

    const handleQuickAdd = () => {
        if (props.formRef.current) {
            const formElementsArray = Array.from(props.formRef.current.elements);
            const formEle = formElementsArray.reduce((elements, element) => {
                
                elements[element.name] = element.value;
                return elements;
              }, {});
            console.log(formEle);
            props.setFormElements(formEle);
          } else {
            console.error('Form not found.');
          }
        props.onHideInputModal();
        props.onShowQuickAddConfirmationModal();
    } 
    const saveRecord = async () => {
        setIsLoading(true);
        if (props.formRef.current) {
            const formElementsArray = Array.from(props.formRef.current.elements);
            formElements = formElementsArray.reduce((elements, element) => {
                
                elements[element.name] = element.value;
                return elements;
              }, {});
            console.log(formElements);
            await addToMaintenanceDb(formElements,props.overrideRecord);
          } else {
            console.error('Form not found.');
          }
        props.onHideInputModal();
        props.setRefresh((x)=>!x);
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
              Add Maintenance
            </Modal.Title>
          </Modal.Header>
          {isLoading && <CenteredSpinner />}
          <Modal.Body>
            <Row>
                <Col>
                    <Form ref={props.formRef}>
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
                        <Form.Check 
                            type='switch'
                            id='overrideRecord'
                            name='overrideRecord'
                            label="Override"
                            onChange={(e)=>props.setOverrideRecord(e.target.checked)}
                        />
                    </Form><br />
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
                <Row>
                    <Col><h6>Add from an excel File</h6></Col>
                    <Col md={4}><ExcelReader onHideInputModal={props.onHideInputModal} 
                        onShowConfirmationModal={props.onShowConfirmationModal}
                        setExcelData={props.setExcelData}
                        excelData={props.excelData}
                        />
                    </Col>
                    <Col><Button variant='outline-primary' size='lg' onClick={saveRecord}>Add</Button>
                        <Button variant='outline-primary' size='lg' onClick={handleQuickAdd}>Quick Add</Button></Col>
                </Row>
            </Modal.Footer>
        </Modal>
        </div>
    )
}

export function AddMaintenance(props){
    const [excelData, setExcelData] = useState(null);
    const formRef = useRef();
    const [formElements,setFormElements] = useState(null);
    const [overrideRecord,setOverrideRecord] = useState(false);
    return (
        <div>
            <QuickAddConfirmationModal
                quickAddConfirmationModalShow={props.quickAddConfirmationModalShow}
                onHideQuickAddConfirmationModal={props.onHideQuickAddConfirmationModal}
                onShowQuickAddConfirmationModal={props.onShowQuickAddConfirmationModal}
                setRefresh={props.setRefresh}
                formRef={formRef}
                formElements={formElements}
                overrideRecord={overrideRecord}
            />
            <InputModal showInputModal={props.showInputModal} 
                onHideInputModal={props.onHideInputModal}
                onShowConfirmationModal={props.onShowConfirmationModal}
                onShowQuickAddConfirmationModal={props.onShowQuickAddConfirmationModal}
                setExcelData={setExcelData}
                excelData={excelData}
                refresh={props.refresh}
                setRefresh={props.setRefresh}
                formRef={formRef}
                setFormElements={setFormElements}
                setOverrideRecord={setOverrideRecord}
                overrideRecord={overrideRecord}
            />
            <ConfirmationModal showConfirmationModal={props.showConfirmationModal} 
                onHideConfirmationModal={props.onHideConfirmationModal}
                excelData={excelData}
                refresh={props.refresh}
                setRefresh={props.setRefresh}
                overrideRecord={overrideRecord}
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

function QuickAddConfirmationModal(props){
    const [isLoading,setIsLoading] = useState(false);
    const [flatNos,setFlatNos] = useState([]);
    const getFlatNos = async() => {
        var flats = [];
        const querySnapshot = await getDocs(collection(firestore, "userData"));
        querySnapshot.forEach((doc) => {
            flats.push(parseInt(doc.data()["flatNo"]));
        });
        flats = [...new Set(flats)];
        flats = flats.sort((a,b) => a-b);
        return flats;
    }
    const quickAddRecord = async () => {
        setIsLoading(true);
        for(var i=0;i<flatNos.length;i++){
            props.formElements["flatNo"] = flatNos[i];
            await addToMaintenanceDb(props.formElements,props.overrideRecord);
        }
        props.setRefresh((x)=>!x);
        setIsLoading(false);
        props.onHideQuickAddConfirmationModal();
    }
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getFlatNos();
            setFlatNos(data);
            setIsLoading(false);
        };
        fetchData();
      }, [props.formRef]);
    return(
        <Modal
            show={props.quickAddConfirmationModalShow}
            onHide={props.onHideQuickAddConfirmationModal}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              <h2>Confirm the data for quick add</h2>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Container>
                <h3>Flat numbers included</h3>
                <Container fluid>
                    {flatNos.map((flatNo)=>(
                        <>
                            <Button variant="outline-info" disabled>{flatNo}</Button>
                        </>
                    ))}
                </Container>
                <hr />
                { (props.formElements != null)?(
                    <Table>
                        <tbody>
                            <tr>
                                <th>Type</th>
                                <td>{props.formElements.type}</td>
                            </tr>
                            <tr>
                                <th>Amount</th>
                                <td>{props.formElements.amount}</td>
                            </tr>
                            <tr>
                                <th>Date</th>
                                <td>{props.formElements.month}-{props.formElements.year}</td>
                            </tr>
                            <tr>
                                <th>Override</th>
                                {(props.overrideRecord === true)?(
                                    <td>True</td>
                                ):(
                                    <td>False</td>
                                )}
                                
                            </tr>
                        </tbody>
                    </Table>
                ):(
                    <>No form element {props.formRef.current}</>
                )}
                
            </Container>
            </Modal.Body>
            {isLoading && <CenteredSpinner />}
            <Modal.Footer>
            <Button size='lg' onClick={quickAddRecord}>Save</Button>
            </Modal.Footer>
        </Modal>
    )
}

function ConfirmationModal(props){
    const [isLoading,setIsLoading] = useState(false);

    const saveExcelData = async () => {
        setIsLoading(true);
        console.log("Excel Data",props.excelData);
        for(var i=0;i<props.excelData.length;i++){
            await addToMaintenanceDb(props.excelData[i],props.overrideRecord);
        }
        setIsLoading(false);
        props.setRefresh((x)=>!x);
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

function UsersModal(props){
    const getUsers = async () => {
        var users = [];
        try{
            const collectionRef = collection(firestore, "userData");
            const q = query(collectionRef);
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                users.push({id:doc.id,data:doc.data()});
            });
            
        }catch(e){
            console.log(e);
        }finally{
            return users;
        }
    }

    const [usersData, setUsersData] = useState([]);
    const [rerunEffect, setRerunEffect] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hideRejectedUsers, setHideRejectedUsers] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            var data = await getUsers();
            data = data.sort((a, b)=> a.data.flatNo-b.data.flatNo);
            setUsersData(data);
            setIsLoading(false);
        };
        fetchData();
      }, [rerunEffect,hideRejectedUsers]);


    const handleChangeUserStatus = async(id, status) => {
        try{
            setIsLoading(true);
            const docRef = doc(firestore, 'userData', id);
            await updateDoc(docRef, { status: status });
            setRerunEffect(!rerunEffect);
            setIsLoading(false);
        }catch(e){
            console.log(e);
        }
    }

    const handleChangeUserType = async(id, type) => {
        try{
            setIsLoading(true);
            const docRef = doc(firestore, 'userData', id);
            await updateDoc(docRef, { userType: type });
            setRerunEffect(!rerunEffect);
            setIsLoading(false);
        }catch(e){
            console.log(e);
        }
    }
    
    return(
        <div>
            <Modal
                show={props.showUsersModal}
                onHide={props.onHideUsersModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                <h2>Users</h2>
                </Modal.Title>
            </Modal.Header> 
            {isLoading && <CenteredSpinner />}
            <Modal.Body>
                    <Container fluid style={{textAlign:'center'}}>
                        <h3>Pending Requests</h3>
                        <div style={{width:"25%"}}>
                            <Form.Check
                                type="switch"
                                id="hide_rejected"
                                label="Hide Rejected Users"
                                onChange={(e)=>setHideRejectedUsers(e.target.checked)}
                            />
                        </div>
                        <Table striped hover bordered responsive>
                            <thead>
                                <tr>
                                    <th>Mobile Number</th>
                                    <th>Name</th>
                                    <th>Flat No</th>
                                    <th>Status</th>
                                    <th colSpan={2}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(hideRejectedUsers===false)?(usersData.map((user)=>(
                                    (user.data.status==="requested" || user.data.status==="rejected")?(
                                    <tr key={user.id}>
                                        <td>{user.data.mobileNo}</td>
                                        <td>{user.data.name}</td>
                                        <td>{user.data.flatNo}</td>
                                        <td>{_.capitalize(user.data.status)}</td>
                                        {(user.data.status==="rejected")?
                                            (<>
                                            <td>
                                                <Button variant='danger' disabled onClick={() => handleChangeUserStatus(user.id,"rejected")}>Reject</Button>
                                            </td>
                                            <td>
                                                <Button variant='success' onClick={() => handleChangeUserStatus(user.id,"accepted")}>Accept</Button>
                                            </td>
                                            </>
                                            ):(
                                            <><td>
                                                <Button variant='danger' onClick={() => handleChangeUserStatus(user.id,"rejected")}>Reject</Button>
                                            </td>
                                            <td>
                                                <Button variant='success' onClick={() => handleChangeUserStatus(user.id,"accepted")}>Accept</Button>
                                            </td>
                                            </>
                                            )}
                                        
                                    </tr>
                                    ):(<></>)
                                ))
                                ):(
                                    usersData.map((user)=>(
                                        (user.data.status==="requested")?(
                                        <tr key={user.id}>
                                            <td>{user.data.mobileNo}</td>
                                            <td>{user.data.name}</td>
                                            <td>{user.data.flatNo}</td>
                                            <td>{_.capitalize(user.data.status)}</td>
                                            {(user.data.status==="rejected")?
                                                (<>
                                                <td>
                                                    <Button variant='danger' disabled onClick={() => handleChangeUserStatus(user.id,"rejected")}>Reject</Button>
                                                </td>
                                                <td>
                                                    <Button variant='success' onClick={() => handleChangeUserStatus(user.id,"accepted")}>Accept</Button>
                                                </td>
                                                </>
                                                ):(
                                                <><td>
                                                    <Button variant='danger' onClick={() => handleChangeUserStatus(user.id,"rejected")}>Reject</Button>
                                                </td>
                                                <td>
                                                    <Button variant='success' onClick={() => handleChangeUserStatus(user.id,"accepted")}>Accept</Button>
                                                </td>
                                                </>
                                                )}
                                            
                                        </tr>
                                        ):(<></>)
                                    )) 
                                )}
                            </tbody>
                        </Table>
                        <hr />
                        <h3>Users</h3>
                        <Table striped hover bordered responsive >
                            <thead>
                                <tr>
                                    <th>Mobile Number</th>
                                    <th>Name</th>
                                    <th>Flat No</th>
                                    <th colSpan={2}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                { usersData.map((user)=>(
                                    (user.data.status!=="requested" && user.data.status!=="rejected")?(
                                        <tr key={user.id}>
                                            <td>{user.data.mobileNo}</td>
                                            <td>{user.data.name}</td>
                                            <td>{user.data.flatNo}</td>
                                            <td>{(user.data.status==="blocked")?
                                                (<Button variant='success' onClick={() => handleChangeUserStatus(user.id,"accepted")}>Unblock</Button>
                                                ):(
                                                    <Button variant='danger' onClick={() => handleChangeUserStatus(user.id,"blocked")}>Block</Button>
                                                )}
                                            </td>
                                            <td>{(user.data.userType==="admin")?
                                                (<Button variant='success' onClick={() => handleChangeUserType(user.id,"user")}>Make as User</Button>
                                                ):(
                                                    <Button variant='danger' onClick={() => handleChangeUserType(user.id,"admin")}>Make as Admin</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ):(<></>)
                                ))}
                            </tbody>
                        </Table>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                <Button variant='danger' size='lg' onClick={props.onHideUsersModal}>Close</Button>
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
    const [showUsersModal,setShowUsersModal] = useState(false);
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
            <UsersModal showUsersModal={showUsersModal}
            onHideUsersModal={()=>setShowUsersModal(false)}
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

                    <Dropdown.Menu className='w-100'>
                    {props.userType === "admin" &&
                    <Dropdown.Item onClick={()=> setShowPaymentRequestsModal(true)}>Payment Requests</Dropdown.Item>}
                    {props.userType === "admin" &&
                    <Dropdown.Item onClick={()=> setShowUsersModal(true)}>Users</Dropdown.Item>}
                    <Dropdown.Item onClick={()=> setShowAboutModal(true)}>About</Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout}>Log out</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

export function Expenses(props){
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [record, setRecord] = useState(null);
    const [modifyExpenseModalShow, setModifyExpenseModalShow] = useState(null);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const getExpensesData = async() => {
        try{
            var tempData = [];
            const collectionRef = collection(firestore, "Expenses");
            const q = query(collectionRef);
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                tempData.push({id:doc.id,data:doc.data()});
            });
            return tempData;
            
        }catch(e){
            toast.error("Unable to get Expenses Data");
        }
    }
    const modifyExpense = (rec) => {
        setRecord(rec);
        setModifyExpenseModalShow(true);

    }
    const getTotalExpenses = (tempData) => {
        var totalExp = 0;
        for(var i=0;i<tempData.length;i++){
            totalExp += parseInt(tempData[i].data.amount);
        }
        setTotalExpenses(totalExp);

    }
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getExpensesData();
            setExpenses(data);
            getTotalExpenses(data);
            setIsLoading(false);
        };
    
        fetchData();
      }, [props.refresh]);

    return(
        <Container fluid className="justify-content-center align-items-center" style={{ height: '550px', backgroundColor: 'lightgray', textAlign:"center"}}>
            <ModifyExpenseModal 
                record={record}
                setRefresh={props.setRefresh}
                modifyExpenseModalShow={modifyExpenseModalShow}
                onHideModifyExpenseModal = {()=> {setModifyExpenseModalShow(false)}}

            />
            <Table striped hover bordered>
                <tbody>
                    <tr>
                        <th>Total Expenses(Rs.)</th>
                        <td>{totalExpenses}</td>
                    </tr>
                </tbody>
            </Table>
            <Table striped hover bordered>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Amount(Rs.)</th>
                        <th>Date</th>
                        {props.userType === "admin" && <th>Action</th>}
                    </tr>
                </thead>
                <tbody>
                {isLoading ? (
                    <tr>
                        <td colSpan={4}><CenteredSpinner /></td>
                    </tr>
                    
                ):
                (expenses)?(
                    expenses.map((expense)=>(
                        <tr key={expense.id}>
                            <td>{expense.data.name}</td>
                            <td>{expense.data.amount}</td>
                            <td>{expense.data.date}</td>
                            {props.userType === "admin" && <td><Button variant='warning' onClick={() => {modifyExpense(expense)}}>Modify</Button></td>}
                        </tr>
                    ))
                ):(
                    <tr></tr>
                )}
                </tbody>
            </Table>
        </Container>
    )
}

function ModifyExpenseModal(props){
    const [isLoading,setIsLoading] = useState(false);
    const formRef = useRef();
    const [name,setName] = useState('');
    const [amount,setAmount] = useState('');
    const [date,setDate] = useState('');

    useEffect(() => {
        if(props.record!==null){
            setName(props.record.data.name || '');
            setAmount(props.record.data.amount || '');
            setDate(props.record.data.date || '');
        }
      }, [props.record]);

    
    const updateExpense = async() => {
        try{
            setIsLoading(true);
            const docRef = doc(collection(firestore,'Expenses'),props.record.id);
            await updateDoc(docRef,{
                name: name,
                amount: amount,
                date: date
            })
            setIsLoading(false);
            props.onHideModifyExpenseModal();
            toast.success("Updated expense: "+ name);
            props.setRefresh((x)=>!x);
        }catch(e){
            console.log(e);
            toast.error("Failed to update expense");
        }
    }
    const deleteExpense = async(record) => {
        try{
            setIsLoading(true);
            await deleteDoc(doc(collection(firestore,'Expenses'),record.id));
            setIsLoading(false);
            props.onHideModifyExpenseModal();
            toast.success("Deleted expense: "+name);
            props.setRefresh((x)=>!x);
        }catch(e){
            toast.error(e);
        }
    }

    return(
        <div>
            <Modal
                show={props.modifyExpenseModalShow}
                onHide={props.onHideModifyExpenseModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                <h2>Confirm Delete Expense</h2>
                </Modal.Title>
            </Modal.Header>
            {isLoading && <CenteredSpinner />}
            <Modal.Body>
                    <Container>
                        <Form ref={formRef}>
                            
                                    {props.record!==null ?(
                                        <>
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control value={name} onChange={(e) => setName(e.target.value)} name="name" id="name" type="text" /><br />
                                        <Form.Label>Amount</Form.Label>
                                        <Form.Control value={amount} onChange={(e) => setAmount(e.target.value)} name="amount" id="amount" type="number" /><br />
                                        <Form.Label>Date</Form.Label>
                                        <Form.Control value={date} onChange={(e) => setDate(e.target.value)} name="date" id="date" type="date" />
                                        </>
                                    ):(<></>)}

                        </Form>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='danger' size='lg' onClick={()=>{deleteExpense(props.record)}}>Delete</Button>
                    <Button variant='success' size='lg' onClick={()=>{updateExpense()}}>Update</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export function AddExpenseModal(props){
    const formRef = useRef();
    const [isLoading,setIsLoading] = useState(false);
    var addedRecord = false;

    const addToExpensesDb = async(recordToAdd) => {
        try{
            await addDoc(collection(firestore,'Expenses'),recordToAdd);
            return true;
        }catch(e){
            toast.error(e)
        }
    }
    const validateExpense = (data) => {
        if(data.name !== ""){
            return true;
        }else if(data.amount !== "" && data.amount!== "0"){
            return true;
        }else if(data.date !== ""){
            return true;
        }
        return false;
    }
    const saveExpense = async() => {
        setIsLoading(true);
        if (formRef.current) {
            const formElementsArray = Array.from(formRef.current.elements);
            const formElements = formElementsArray.reduce((elements, element) => {
                elements[element.name] = element.value;
                return elements;
              }, {});
            console.log("expenses",formElements);
            const isValid = validateExpense(formElements);
            if(isValid){
                addedRecord = await addToExpensesDb(formElements);
            }
        } else {
        console.error('Form not found.');
        }
        props.onHideExpenseModal();
        if(!addedRecord){
            toast.error("Could not add Expense");
        }else{
            toast.success("Added data successfully");
        }
        props.setRefresh((x)=>!x);
        setIsLoading(false);
    }

    return(
        <div>
            <Modal
                show={props.expenseModalShow}
                onHide={props.onHideExpenseModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                <h2>Add Expense</h2>
                </Modal.Title>
            </Modal.Header>
            {isLoading && <CenteredSpinner />}
            <Modal.Body>
                    <Container>
                        <Form ref={formRef}>
                            <Form.Label>Name</Form.Label>
                            <Form.Control type='text' id='name' name='name'/>
                            <Form.Label>Amount</Form.Label>
                            <Form.Control type='number' id='amount' name='amount'/>
                            <Form.Label>Date</Form.Label>
                            <Form.Control type='date' id='date' name='date'/>
                        </Form>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='primary' size='lg' onClick={saveExpense}>Save</Button>
                    <Button variant='danger' size='lg' onClick={props.onHideExpenseModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}