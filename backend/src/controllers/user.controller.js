import httpStatus from "http-status";
import User from "../models/user.model.js";
import bcrypt, {hash} from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
import mongoose from "mongoose";

const login = async(req, res) =>{

    const { username, password } = req.body;

    if(!username || !password){
        return res.status(400).json({message: "Please provide"});
    }
    try{
        const user = await User.findOne({
        $or: [{ username }, { email: username }],
         });

        if(!user) {
            return res.status(httpStatus.NOT_FOUND).json({message: "User not found"});
        }
       let isPasswordCorrect = await bcrypt.compare(password, user.password)
       if(isPasswordCorrect){
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token: token});
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({messgae: "Invalid Username or Password"});
        }
    } catch (e) {
        return res.status(500).json({message: `Something went wrong ${e}`})
    }
}

const register = async (req, res) =>{
    const {name, username, email, password} = req.body;
    // this is from chatgpt
    
  // ✅ Step 1: Check for empty fields
  if (!name || !username ||!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

    try{
        const existingUser = await User.findOne({username});
        if(existingUser) {
            return res.status(httpStatus.FOUND).json({message: "User already exist"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            email: email,
            password: hashedPassword
        });
      
        await newUser.save();
        res.status(httpStatus.CREATED).json({message: "User Register"});
    } catch (e){
        res.json({message: `Something went wrong ${e}`})
    }
}

const getUserHistory = async (req, res) =>{
    const {token} = req.query;

    try{
        const user = await User.findOne({token: token})
        const meetings = await Meeting.find({user_id: user.username})
        res.json(meetings)
    } catch(e){
        res.json({message: `Something went wrong ${e}`})
    }
}

const addToHistory = async(req, res) =>{
    const {token, meeting_code} = req.body;

    try{
        const user = await User.findOne({token: token});
        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })
        await newMeeting.save();
        res.status(httpStatus.CREATED).json({message: "Added code to history"})
    } catch(e) {
        res.json({message: `Something went wrong ${e}`})
    }
}
export { login, register, getUserHistory, addToHistory };