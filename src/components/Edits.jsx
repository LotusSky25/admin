import { useState } from "react"
import AddStudent from "./AddStudent"
import Modal2 from "./Modal2"

export default function Edits(){
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            {showModal &&(<Modal2 handleCloseModal={()=>{setShowModal(false)}}>
                <AddStudent handleCloseModal={()=>{setShowModal(false)}}/>
            </Modal2>)}
            <hr></hr>
            <button onClick={()=>{setShowModal(true)}}><h3>Add New Student</h3></button>
        </>
    )
}