import { useState, useEffect} from "react"
import {db } from "../../firebase"
import { addDoc, doc, setDoc, increment, getDocs, collection, deleteDoc} from "firebase/firestore"
import {httpsCallable, getFunctions} from 'firebase/functions'

//just what's visible when you click "add student"
export default function AddStudent(props) {
    //access to handle close modal function
    const {handleCloseModal} = props;
    //states to store data
    const [studentData, setStudentData] = useState([])
    const [name, setName] = useState("")
    const [targetGroup, setTargetGroup] = useState("")
    const [groups, setGroups] = useState([])
    const [year, setYear] = useState(0)
    const [Dob, setDob] = useState("")
    const [selectedStudent, setSelectedStudent] = useState([])
    //states for conditional rendering
    const [showGroups, setShowGroups] = useState(true)
    const [showStudentData, setShowStudentData] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isAddStudent, setIsAddStudent] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [hasDecided, setHasDecided] = useState(false)
    const [isDeleted, setIsDeleted] = useState(false)
    const [listStudents, setListStudents] = useState(false)

    const group = calculateGroup()
    const functions = getFunctions()
    const deleteStudent = httpsCallable(functions, 'deleteStudent')
    
    //function to fetch data
    async function fetchData(col) {
            try {
                const querySnapshot = await getDocs(collection(db, col))
                //empty array for data
                const data = []
                //push each student doc into the data array
                querySnapshot.forEach((doc)=> {
                    data.push({id: doc.id, ...doc.data()})
                })
                return data //this is an array of objects
            } catch (err) {
                console.log(err)
            }
        }
        useEffect(()=>{
            async function getData(){
                //call fetchData to send query to firestore
                const studentData = await fetchData("students")
                const groupData = await fetchData("groups")
                //update useState to be mapped below
                setStudentData(studentData)
                setGroups(groupData)
            }
            getData()
            
        }, [])

    // function to calculate group based on year HARDCODED
    function calculateGroup(){
        if (year<=2) {
            return "Kowhai"
        } else if (year<=4){
            return "Magnolias"
        } else {
            return "Oaks"
        }
    }
    //function to add student document to database 
    async function addStudent() {
        try {    
            const docRef = doc(db, "students", name)
            const res = await setDoc(docRef, {
                name: name,
                group: group,
                grade: year,
                Dob: Dob
            }, {merge: true})
            console.log(name)
            //reset states
            setIsSubmitted(true)
            setName("")
            setYear(0)
            const docRef2 = doc(db, "groups", group)
            const res2 = await setDoc(docRef2, {
                student_count: increment(1)
            }, {merge: true})
            console.log(name)
        } catch(err) {
            console.log(err)
        }
    }
    //function to delete student document and all associated subcollections and documents 
    async function callDeleteStudent(student) { 
        try{
            const res = await deleteStudent({path: "students/" + student.id})
            console.log(res.data)
            if (res.data.ok) {
                setIsDeleted(true)
            }

        } catch (err){
            console.log(err)
        }
        
    }
    return (
        <>
            {!hasDecided&&( //render initial option menu
                <>
                <div class="choose-action">
                    <h2>What would you like to do?</h2>
                    <button class="edit-button" onClick={()=>{setIsEdit(true), setHasDecided(true)}}><p>Edit Student Data</p></button>
                    <button class="edit-button" onClick={()=>{setIsAddStudent(true), setHasDecided(true)}}><p>Add Student</p></button>
                </div>
                </>
            )}
            {isAddStudent&&( //render if the user wants to add a new student
                <>
                    {!isSubmitted && ( //conditionally render out input if form hasn't been submitted
                    <>
                    <div class="manage-students-header">
                        <button class="edit-return-button" onClick={()=>{setHasDecided(false), setIsAddStudent(false)}}><i class="fa-solid fa-arrow-left"></i></button>
                        <h2>Add New Student</h2>
                    </div>
                    <div class="display-add-student">
                        <p>Student Name</p>
                        <input value={name} onChange={(e)=>{setName(e.target.value)}} placeholder="Name"></input>
                        <p>Student Date of Birth</p>
                        <input value={Dob} onChange={(e)=>{setDob(e.target.value)}} placeholder="Date of Birth"></input>
                        <p>Student Current School Year</p>
                        <input value={year} onChange={(e)=>{setYear(e.target.value)}} placeholder="Year"></input>
                        <button class="add-student-button" onClick={()=>{addStudent()}}><p>Add New Student</p></button>
                    </div>
                    </>
                    )}

                    {isSubmitted && ( //response if has been submitted: offer different options to escape modal
                        <>
                            <p>New student added successfully!</p>
                            <button class="edit-return-button" onClick={()=>{handleCloseModal()}}><i class="fa-solid fa-arrow-left"></i>Return</button>
                            <button onClick={()=>{setIsSubmitted(false)}}>Add another student</button>
                        </>
                    )}
                </>
            )}
            {isEdit&&( //render if the user wants to edit existing student data
                <>
                    {showGroups &&(
                        <div class="group-select">
                            <div class="manage-students-header">
                            <button class="edit-return-button" onClick={()=>{setHasDecided(false), setIsEdit(false)}}><i class="fa-solid fa-arrow-left"></i></button>
                            <h2>Choose your group</h2>
                            </div>
                            {groups.map(function(group, idx){
                                return(
                                    <button class={"group-button" + "-"+group.group} key={idx} onClick={()=>{setTargetGroup(group.group), setShowGroups(false), setListStudents(true)}}><p>{group.group}</p></button>
                                )
                            })}
                        </div>)}
                    {listStudents&& //list students in selected group
                        (
                        <><div class="manage-students-header">
                            <button class="edit-return-button" onClick={()=>{setShowGroups(true), setListStudents(false)}}><i class="fa-solid fa-arrow-left"></i></button>
                            <h2>{targetGroup}</h2>
                        </div>
                        <div class="roll">
                        {studentData.map(function(student, option){
                        if (student.group == targetGroup){
                            return( <button 
                                //sexy interactive buttons
                                class={"group-button-"+targetGroup}
                                key={option}
                                type="button"
                                //when clicked, progress to student data and set selected student to current student
                                onClick={()=>{
                                    setSelectedStudent(student), 
                                    setShowStudentData(true),
                                    setListStudents(false)
                                }}
                                ><p>{student.name}</p></button>)
                        }})}
                        </div>
                    </>
                    )}
                    {showStudentData &&(//render once specific student is selected
                            <>
                            <div class="manage-students-header">
                            <button class="edit-return-button" onClick={()=>{setListStudents(true), setShowStudentData(false)}}><i class="fa-solid fa-arrow-left"></i></button>
                            <h2>{selectedStudent.name}</h2>
                            </div>  
                                <div class="student-data">
                                    <p><b>Name:</b> {selectedStudent.name}</p>
                                    <p><b>Date of Birth:</b> {selectedStudent.grade}</p>
                                    <p><b>Grade:</b> {selectedStudent.grade}</p>
                                    <p><b>Group:</b> {selectedStudent.group}</p>
                                    <button class="delete-student-button" onClick={()=>{callDeleteStudent(selectedStudent), setShowStudentData(false)}}><p>Delete Student</p></button>
                                </div>
                            </>
                        )}
                        {isDeleted&&(
                            <>
                                <div class="isDeleted">
                                    <button class="edit-return-button" onClick={()=>{
                                        setHasDecided(false), 
                                        setIsEdit(false), 
                                        setIsDeleted(false)}}><i class="fa-solid fa-arrow-left"></i>Return</button>
                                    <p>Student deleted successfully</p>
                                </div>
                            </>
                        )}

                </>
            )}
        </>
    )
}