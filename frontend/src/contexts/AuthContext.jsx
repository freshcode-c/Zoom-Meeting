import { createContext } from "react";
import axios from "axios";
import React, { useState } from "react";
import httpStatus from "http-status";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users"
})

export const AuthProvider = ({children}) =>{
   // const authContext = useContext(AuthContext);

   // const [userData, setUserData] = useState(authContext);
   const [userData, setUserData] = useState(null);


    const handleRegister = async (name, username, password) =>{
        try{
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })
            console.log("response recieved",request.status, request.data )// , ke bd thinks are added from chatgpt

            if(request.status === httpStatus.CREATED){
                return request.data.message;
            }
        } catch (err){
             console.error(" Register error:", err.response?.data || err.message);
            throw err;
        }
    }

    const handleLogin = async (username, password) =>{
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if(request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                return request.data;
            }
        } catch (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) =>{
        try{
            let request = await client.post("/add_to_activity",{
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (err){
            throw e;
        }
    }

    const getHistoryOfUser = async() =>{
        try{
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch (err) {
            throw err;
        }
    }
   // const router = useNavigate();

    const data = {
        userData,setUserData, addToUserHistory, getHistoryOfUser,  handleRegister, handleLogin 
    }

    return(
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}

