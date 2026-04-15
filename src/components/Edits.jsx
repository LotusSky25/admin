import { useState } from "react"
import AddStudent from "./AddStudent"
import AddAdmin from "./AddAdmin"
import Modal2 from "./Modal2"
import Modal3 from "./Modal3"

export default function Edits(){
    const [showModal1, setShowModal1] = useState(false)
    const [showModal2, setShowModal2] = useState(false)

    return (
        <>
            {showModal1 &&(<Modal2 handleCloseModal={()=>{setShowModal1(false)}}>
                <AddStudent handleCloseModal={()=>{setShowModal1(false)}}/>
            </Modal2>)}
            {showModal2 &&(<Modal3 handleCloseModal={()=>{setShowModal2(false)}}>
                <AddAdmin handleCloseModal={()=>{setShowModal2(false)}}></AddAdmin>
            </Modal3>)}
            <hr></hr>
            <div class="manage-students">
                <button class="manage-students-button" onClick={()=>{setShowModal1(true)}}><h3>Manage Students</h3></button>
                <button class="manage-students-button" onClick={()=>{setShowModal2(true)}}><h3>Add Admin</h3></button>
            </div>
        </>
    )
}