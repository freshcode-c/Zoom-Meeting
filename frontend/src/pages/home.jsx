import React, { useState, useContext } from 'react';
import withAuth from '../utils/withAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import "../App.css";
import RestoreIcon from '@mui/icons-material/Restore';
import IconButton from '@mui/material/IconButton';
import { Button, TextField } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';


 function HomeComponent() {

  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const {addToUserHistory} = useContext(AuthContext)
  let handleJoinVideoCall = async() =>{
    await addToUserHistory(meetingCode)
    navigate(`/${meetingCode}`);
  }
  return (
    <>

    <div className='navBar'>

      <div style={{display:"flex", alignItems: "center"}}>

        <h2>Video Call</h2>
      </div>
      <div style={{display: "flex", alignItems: "center"}}>

        <IconButton onClick={
          () =>{
            navigate("/history")
          }
        }>
          <RestoreIcon />
        </IconButton>
        <p>History</p>
        <Button onClick={()=>{
          localStorage.removeItem("token")
          navigate("/auth")
        }} >Logout</Button>
      </div>
    </div>
    <div className="meetContainer">
      <div className="leftPanel">
        <div>
          <h2>Providing Quality Video Call Just Like Quality Education</h2>
          <div style={{display: "flex", gap: "10px"}}>
            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant='outlined'></TextField>
            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
          </div>
        </div>
      </div>
      <div className="rightPanel">
        <img src="/logo.png" alt="App Logo" />
      </div>
    </div>
    </>
  )
}

export default withAuth(HomeComponent);

