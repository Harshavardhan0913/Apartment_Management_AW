import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { CenteredSpinner } from './utils';

function Login(){
    const navigate = useNavigate();
    const mobileNo = useRef();
    const password = useRef();
    const [isLoading,setIsLoading] = useState(false);
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
        setIsLoading(true);
        console.log(mobileNo.current.value);
        console.log(password.current.value);
        await getUsersList();
        console.log(userDetails);
        for(var i=0;i<userDetails.length;i++){
            if(parseInt(userDetails[i].mobileNo) === parseInt(mobileNo.current.value) && 
                userDetails[i].password === password.current.value){
                if(userDetails[i].status === "requested"){
                    toast.info("User sign in request still in progress");
                    isValid="notInvalid";
                }
                else if(userDetails[i].status === "rejected"){
                    toast.error("User sign in request rejected. Contact owner");
                    isValid="notInvalid";
                }
                else {
                    stateObject.userId = userDetails[i].userId;
                    stateObject.flatNo = userDetails[i].flatNo;
                    stateObject.userType = userDetails[i].userType;
                    isValid = "true";
                }
            }
        };
        setIsLoading(false);
        if( isValid === "true"){
            navigate('/home', {state: stateObject});
        }else if(isValid === "false"){
            toast.error("Invalid Login");
        };
    }

    return(
            <Container fluid className="justify-content-center align-items-center vh-100">
                <Form>
                    {isLoading && <CenteredSpinner />}
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

function SignUp(props){
    const name = useRef();
    const mobileNo = useRef();
    const flatNo = useRef();
    const password = useRef();
    const [isLoading,setIsLoading] = useState(false);

    const validateUser = async(user) => {
        try{
            if(user.mobileNo.length !== 10){
                return "Mobile number not Valid";
            }
            const collectionRef = collection(firestore, "userData");
            const q = query(collectionRef, 
                where("mobileNo", "==", user['mobileNo']));
            const querySnapshot = await getDocs(q);
            console.log(querySnapshot);
            console.log(querySnapshot.size);
            if(parseInt(querySnapshot.size) > 0){
                return "User Already exists";
            }
        }catch(e){
            console.log(e);
            return "";
        }
        return "";
    }

    const handleSignIn = async () => {
        setIsLoading(true);
        const newUser = {
            "userId": uuidv4(),
            "name": name.current.value,
            "mobileNo": mobileNo.current.value,
            "flatNo": flatNo.current.value,
            "password": password.current.value,
            "userType": "user",
            "status": "requested"
        }
        try{
            const validationMessage = await validateUser(newUser);
            console.log(validationMessage);
            if(validationMessage!== ""){
                toast.error(validationMessage);
            }else{
                const docRef = await addDoc(collection(firestore, "userData"), newUser);
                console.log(docRef.id);
                toast.info("Request for new user sent successfully");
                props.setLos("login");
            }
        }catch(e){
            toast.error("Failed to Sign in user");
            console.log(e);
        }
        setIsLoading(false);
    }

    return(
        <Container fluid className="justify-content-center align-items-center vh-100">
            <div style={{position:'absolute',width:'25%'}}
             >{isLoading && <CenteredSpinner/>}</div>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type='text' name='name' ref={name} placeholder='Name' required/><br />
                    <Form.Label>Mobile Number</Form.Label>
                    <Form.Control type='number'
                            name='mobileNumber' ref={mobileNo}  
                            placeholder='Mobile Number' required
                            /><br />
                    <Form.Label>Flat Number</Form.Label>
                    <Form.Control type='number' name='flatNumber' ref={flatNo} placeholder='Flat Number' required/><br />
                    <Form.Label>Password</Form.Label>
                    <Form.Control type='password' name='password' ref={password} placeholder='Password' required/>
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
                    { los === "signin" && <SignUp setLos={setLos}/>}
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;
