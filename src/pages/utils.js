import { collection, getDocs, where, query, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Button, Container, Table, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';

const getData = async (type,userId,userType) => {
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
                        where("userId","==",userId));
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
            maintenanceData.push(doc.data());
        });
        console.log("maintenance_data",maintenanceData);
        
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
            const data = await getData(props.type, props.userId, props.userType);
            setRecordData(data);
            setIsLoading(false);
        };
    
        fetchData();
      }, [props.type,props.userId,props.userType]);
    console.log(recordData);
    return(
        <Container fluid className="justify-content-center align-items-center" style={{ height: '550px', backgroundColor: 'lightgray'}}>
            <Table striped bordered hover size='lg'>
                <thead>
                    <tr>
                        <th>Bill Type</th>
                        <th>Amount</th>
                        <th>Month</th>
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
                        <tr>
                            <td>{record.type}</td>
                            <td>{record.amount}</td>
                            <td>{record.month}</td>
                            <td>{record.paid}</td>
                            <td><Button variant='success'>Pay Now</Button></td>
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

export function AddExpense(props){
    const formRef = useRef(null);
    var formElements = {};
    const addToDb = async (recordToAdd) =>{
        var addRecordToUsers = [];
        try{
            const collectionRef = collection(firestore, "userData");
            const q = query(collectionRef, 
                where("flatNo", "==",recordToAdd['flatNo']));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                addRecordToUsers.push(doc.data()["userId"]);
            });
            console.log("addRecordToUsers",addRecordToUsers);
        }catch(e){
            console.log(e);
        }
        if(addRecordToUsers.length === 0){
            
            alert("Flat number does not exist");
        }else{
            for(var i=0;i<addRecordToUsers.length;i++){
                recordToAdd['paid'] = "unpaid";
                recordToAdd['mod'] = "";
                recordToAdd['adminAcceptance'] = "";
                recordToAdd['userId'] = addRecordToUsers[i];
                delete recordToAdd['flatNo']
                
                try{
                    const docRef = await addDoc(collection(firestore,'Maintenance'),recordToAdd);
                    console.log("Document added to Db");
                }catch(e){
                    console.log(e);
                }
            }
        }
    }
    const saveRecord = () => {
        console.log("Save button");
        if (formRef.current) {
            const formElementsArray = Array.from(formRef.current.elements);
            formElements = formElementsArray.reduce((elements, element) => {
                elements[element.name] = element.value;
                return elements;
              }, {});
            console.log(formElements);
            addToDb(formElements);
          } else {
            console.error('Form not found.');
          }
        props.onHide();
    }


    return (
        <Modal
          {...props}
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
            <div>
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
                    <Form.Label>Flat Number</Form.Label>
                    <Form.Control type="number" id='flatNo' name="flatNo" />
                </Form>
            </div>
          </Modal.Body>
          <Modal.Footer>
          <Button onClick={saveRecord}>Save</Button>
        <Button onClick={props.onHide}>Close</Button>
          </Modal.Footer>
        </Modal>
      );
}
