import { collection, getDocs, where, query, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Button, Container, Table, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

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
                        <td colSpan={5}><CenteredSpinner size="60px" /></td>
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

const CenteredSpinner = ({size}) => {
    return (
        <div style={{textAlign:"center"}}>
            <Spinner animation="border" variant="success" style={{width:size, height:size}}  />
        </div>
    )
}

export function Records(props){
    const [recordData,setRecordData] = useState([]);
    const [isLoading,setIsLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getData(props.type, props.flatNo, props.userType);
            setRecordData(data);
            setIsLoading(false);
        };
    
        fetchData();
      }, [props.type,props.flatNo,props.userType]);
    return(
        <Container fluid className="justify-content-center align-items-center" style={{ height: '550px', backgroundColor: 'lightgray'}}>
            <Table striped bordered hover size='lg'>
                <thead>
                    <tr>
                        <th>Bill Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Paid</th>
                        <th>Action</th>
                    </tr>
                </thead>
                {isLoading ? (
                <tbody>
                    <tr>
                        <td colSpan={5}><CenteredSpinner size="60px" /></td>
                    </tr>
                </tbody>
                ) : (
                <tbody>
                    {recordData.map((record) => (
                        <tr key={record.id}>
                            <td>{record.data.type}</td>
                            <td>{record.data.amount}</td>
                            <td>{record.data.month.substring(0,3)}-{record.data.year}</td>
                            <td>{record.data.paid}</td>
                            <td><Button variant='success' disabled>Pay Now</Button></td>
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
    const saveRecord = async () => {
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
        alert("Added Excel data\n Data not added for flat no:"+JSON.stringify(recordsNotAdded));
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
              Modal heading
            </Modal.Title>
          </Modal.Header>
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
                alert("No Data Found");
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
    const saveExcelData = async () => {
        var recordsNotAdded = [];
        var flatNo = null;
        console.log("Excel Data",props.excelData);
        for(var i=0;i<props.excelData.length;i++){
            flatNo = await addToDb(props.excelData[i]);
            if(flatNo){recordsNotAdded.push(flatNo);}
        }
        alert("Added Excel data\n Data not added for flat no:"+JSON.stringify(recordsNotAdded));
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