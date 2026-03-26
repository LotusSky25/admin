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
            <div class="manage-students">
                <button class="manage-students-button" onClick={()=>{setShowModal(true)}}><h3>Manage Students</h3></button>
            </div>
        </>
    )
}