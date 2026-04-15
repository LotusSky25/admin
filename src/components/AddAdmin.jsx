import {useEffect} from 'react'
import {httpsCallable, getFunctions} from 'firebase/functions'
import {app} from '../../firebase'
import {onAuthStateChanged, getAuth} from 'firebase/auth'
import { useState } from 'react'

export default function AddAdmin(props) {
    
    const {handleCloseModal} = props;
    const functions = getFunctions()
    const addAdmin = httpsCallable(functions, 'addAdmin')
    const [email, setEmail] = useState("")
    const [isAdded, setIsAdded] = useState(false)
    const [error, setError] = useState("")

    async function callAddAdmin({ email }) {
        if(email == "" || !email.includes("@")) {
            setError("")
            setError("Please enter a valid email address.")
            return
        }
        try{
            const res = await addAdmin({email})
            console.log(res.data)
            if (res.data.ok) {
                setIsAdded(true)
            }

        } catch (err){
            console.log(err)
                if (err?.code === "functions/unauthenticated") {
                    setError("Please sign in first.")
                } else if (err?.code === "functions/permission-denied") {
                    setError("Only admins can add new admins.")
                } else if (err?.code === "functions/invalid-argument") {
                    setError("Please enter a valid email address.")
                } else if (err?.code === "functions/not-found") {
                    setError("No user exists with that email. Ask them to register in the mobile app first.")
                } else if (err?.code === "functions/internal") {
                    setError("Server error while adding admin. Please try again.")
                } else {
                    setError("Unable to add admin right now. Please try again.")
                }
            
        }
    }

    return (
    <>
        {error !="" && (
            <div class="error">
                <p>❌{error}</p>
            </div>
        )}
        {!isAdded &&(<div class="addAdmin-content">
            <h2>Add an administrator</h2>
            <p>Enter the email address of the user you would like to give admin privileges to below:</p>
            <div class="admin-input">
                <input value={email} onChange={(e)=>{setEmail(e.target.value)}} placeholder="Email"></input>
                <button class="addAdmin-button" onClick={()=>{callAddAdmin({email})}}><p>Add</p></button>
            </div>
            <div class="warning">
                <p>⚠️ As an admin this person will be able to access the admin dashboard and view all student data and history, including that recorded prior to their becoming an admin. Only give admin privileges to trusted individuals.</p>
            </div>
            <h5><b>Please note:</b> Only existing users can be awarded admin privileges. Ensure the user has registered on the mobile app. </h5>
        </div>)}
        {isAdded &&(
            <div class="is-submitted">
                <p>✅ The user with email address {email} is now an admin.</p>
                <button class="edit-return-button" onClick={()=>{handleCloseModal(), setEmail(""), setIsAdded(false)}}><i class="fa-solid fa-arrow-left"></i>Return</button>
                <button class="edit-button" onClick={()=>{setIsAdded(false), setEmail("")}}>Add another admin</button>
            </div>
        )}
    </>
    )
}