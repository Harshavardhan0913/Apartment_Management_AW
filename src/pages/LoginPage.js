import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

function Login(){
    const navigate = useNavigate();
    const mobileNo = useRef();
    const password = useRef();
    var userDetails = [];
    var isValid = "false";
    var stateObject = {
        userId:-1,
    };
    const getUsersList = async () => {
        try{
            const querySnapshot = await getDocs(collection(firestore,'userData'));
            var newData = [];
            querySnapshot.forEach((doc) => {
                newData.push(doc.data());
              });
            userDetails = newData;
        }catch(e){
            console.log(e);
        }
    }

    const handleLogin = async () => {
        console.log(mobileNo.current.value);
        console.log(password.current.value);
        await getUsersList();
        console.log(userDetails);
        for(var i=0;i<userDetails.length;i++){
            if(parseInt(userDetails[i].mobileNo) === parseInt(mobileNo.current.value) && userDetails[i].password === password.current.value){
                stateObject.userId = userDetails[i].userId;
                stateObject.flatNo = userDetails[i].flatNo;
                stateObject.userType = userDetails[i].userType;
                isValid = "true";
            }
        };
        if( isValid === "true"){
            navigate('/home', {state: stateObject});
        }else{
            alert("Invalid Login");
        };
    }

    return(
            <Container fluid className="justify-content-center align-items-center vh-100">
                <Form>
                    <Form.Group>
                        <Form.Label>Mobile Number:</Form.Label>
                        <Form.Control 
                            type="tel" 
                            required 
                            ref={mobileNo}
                        />
                        <Form.Label>Password:</Form.Label>
                        <Form.Control 
                            type="password" 
                            required 
                            ref={password}
                        />
                    </Form.Group><br />
                    <Button className='w-100' onClick={handleLogin}>Login</Button>
                </Form>
            </Container>
    );
}

function SignUp(){
    const name = useRef();
    const mobileNo = useRef();
    const flatNo = useRef();
    const password = useRef();
    const navigate = useNavigate();
    var stateObject = {
        userId:-1,
    };

    const handleSignIn = async () => {
        console.log("in function");
        const newUser = {
            "userId": uuidv4(),
            "name": name.current.value,
            "mobileNo": mobileNo.current.value,
            "flatNo": flatNo.current.value,
            "password": password.current.value,
            "userType": "user",
            "status": "requested"
        }
        console.log(newUser);
        try{
            const docRef = await addDoc(collection(firestore, "userData"), newUser);
            console.log(docRef.id);
            stateObject.userId = newUser.userId;
            navigate('/home', {state: stateObject});
        }catch(e){
            console.log(e);
        }
    }

    return(
        <Container fluid className="justify-content-center align-items-center vh-100">
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type='text' name='name' ref={name} placeholder='Name' /><br />
                    <Form.Label>Mobile Number</Form.Label>
                    <Form.Control type='number' name='mobileNumber' ref={mobileNo}  placeholder='Mobile Number' /><br />
                    <Form.Label>Flat Number</Form.Label>
                    <Form.Control type='number' name='flatNumber' ref={flatNo} placeholder='Flat Number' /><br />
                    <Form.Label>Password</Form.Label>
                    <Form.Control type='password' name='password' ref={password} placeholder='Password' />
                </Form.Group>
                <Button className='w-100' onClick={handleSignIn}>Sign In</Button>
            </Form>
        </Container>
    );
}

function LoginPage(){
    const [los,setLos] = useState("login");

    return(
        <Container fluid className="justify-content-center align-items-center" style={{width: '400px', height: '550px', backgroundColor: 'lightgray'}} >
            <Row>
                <Col className='text-center'>
                    <h1>Apartment Management</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button className='w-100' variant='secondary' onClick={()=>{setLos("login")}} >Login</Button>
                </Col>
                <Col>
                    <Button className='w-100' variant='secondary' onClick={()=>{setLos("signin")}}>Sign In</Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    { los === "login" && <Login />}
                    { los === "signin" && <SignUp />}
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;
