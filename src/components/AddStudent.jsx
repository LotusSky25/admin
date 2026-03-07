import { useState } from "react"
import {db } from "../../firebase"
import { addDoc, doc, setDoc } from "firebase/firestore"

//just what's visible when you click "add student"
export default function AddStudent(props) {
    const {handleCloseModal} = props;
    const [name, setName] = useState("")
    const [year, setYear] = useState(0)
    const group = calculateGroup()
    const [isSubmitted, setIsSubmitted] = useState(false)

    function calculateGroup(){
        if (year<=2) {
            return "Kowhai"
        } else if (year<=4){
            return "Magnolias"
        } else {
            return "Oaks"
        }
    }
    async function addStudent() {
        try {    
            const docRef = doc(db, "students", name)
            const res = await setDoc(docRef, {
                name: name,
                group: group,
                year: year
            }, {merge: true})
            console.log(name)
            setIsSubmitted(true)
            setName("")
            setYear(0)
        } catch(err) {
            console.log(err)
        }
    }
    return (
        <>
            {!isSubmitted && (
                <>
                    <h3>Add New Student</h3>
                    <p>Student Name</p>
                    <input value={name} onChange={(e)=>{setName(e.target.value)}} placeholder="Name"></input>
                    <p>Student Current School Year</p>
                    <input value={year} onChange={(e)=>{setYear(e.target.value)}} placeholder="Year"></input>
                    <button onClick={()=>{addStudent()}}>Add New Student</button>
                </>
            )}
            {isSubmitted && (
                <>
                    <p>New student added successfully!</p>
                    <button onClick={()=>{handleCloseModal()}}>Return</button>
                    <button onClick={()=>{setIsSubmitted(false)}}>Add another student</button>
                </>
            )}
        </>
    )
}