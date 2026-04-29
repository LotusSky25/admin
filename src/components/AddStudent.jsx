import { useState, useEffect, useCallback} from "react"
import {db } from "../../firebase"
import { addDoc, doc, setDoc, increment, getDocs, collection} from "firebase/firestore"
import {httpsCallable, getFunctions} from 'firebase/functions'
import { useAuth } from "../context/AuthContext"

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
    const [isRegistered, setIsRegistered] = useState(true)
    //states for conditional rendering
    const [showGroups, setShowGroups] = useState(true)
    const [showStudentData, setShowStudentData] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isAddStudent, setIsAddStudent] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [hasDecided, setHasDecided] = useState(false)
    const [isDeleted, setIsDeleted] = useState(false)
    const [listStudents, setListStudents] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState("")

    const group = calculateGroup()
    const functions = getFunctions()
    const deleteStudent = httpsCallable(functions, 'deleteStudent')
    const { globalData } = useAuth()
    
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
                return []
            }
        }
        //function to get data from firestore 
        //callback to make sure it only 
        const getData = useCallback(async(student) => {
            //call fetchData to send query to firestore
            const studentData = await fetchData("students")
            const groupData = await fetchData("groups")
            //update useState to be mapped below
            setStudentData(studentData)
            setGroups(groupData)
            //if a student parameter was passed to the function
            if (student) {
                //check if the student is still in studentData
                const updated = studentData.find((s)=>s.id === student.id)
                //if so, update the selectedStudent state (to update UI)
                if (updated) {
                    setSelectedStudent(updated)
                }
            }
        }, [])

        useEffect(()=>{
            getData()
        }, [getData])

    // function to calculate group based on year HARDCODED
    function calculateGroup(){
        const isInt = Number.isInteger(year) || (typeof year === "string" && /^\d+$/.test(year.trim()))
        if (!isInt) {return year}
        if (year<=2) {
            return "Kowhai"
        } else if (year<=4){
            return "Magnolias"
        } else {
            return "Oaks"
        }
    }
    function checkStudent(name) {
        const normalizedName = name.trim().toLowerCase()
        return !studentData.some((student) => {
            return (student.name || "").trim().toLowerCase() === normalizedName
        })
    }
    //function to add student document to database 
    async function addStudent() {
        setIsLoading(true)
        setError("")
        //check is student is within program age range, return if too old
        if (year > 6 || year < 0) {
            setError("Student is too young/old for the program!")
            setIsLoading(false)
            return
        }
        const unique = checkStudent(name)
        if (unique) {
            try {    
                const newName = name.trim()
                await addDoc(collection(db, "students"), {
                    name: newName,
                    group: group,
                    grade: year,
                    Dob: Dob,
                    registered: true,
                    sessions_since_registered: 0,
                    sessions_attended: 0,
                    code: globalData?.code || ""
                })
                const docRef2 = doc(db, "groups", group)
                await setDoc(docRef2, {
                    student_count: increment(1),
                    code: globalData?.code || ""
                }, {merge: true})
                //reset states
                setIsSubmitted(true)
                setName("")
                setYear(0)
                //reload firestore data to reflect changes
                await getData()
            } catch(err) {
                console.log(err)
                setError("Unable to add student right now.")
            } finally {
                setIsLoading(false)
            }
        }
        else {
            setError("Student already exists. Please ensure the new student's name is unique.")
            setIsLoading(false)
        }
    }
    //funcion to update student data in firestore 
    async function updateStudentData(student) {
        //engage loading state
        setIsLoading(true)
        //update in firestore 
        try {    
            const docRef = doc(db, "students", student.id)
            await setDoc(docRef, {
                name: name.trim(),
                group: group,
                grade: year,
                Dob: Dob,
                sessions_since_registered: student.sessions_since_registered,
                sessions_attended: student.sessions_attended,
                registered: isRegistered,
                code: globalData?.code || ""
            }, {merge: true})
            //if the group changed (because the user changed the student's year)
            //update the student count in the old and new group
            if (student.group !== group) {
                const previousGroupRef = doc(db, "groups", student.group)
                const nextGroupRef = doc(db, "groups", group)
                await setDoc(previousGroupRef, {
                    student_count: increment(-1),
                    code: globalData?.code || ""
                }, {merge: true})
                await setDoc(nextGroupRef, {
                    student_count: increment(1),
                    code: globalData?.code || ""
                }, {merge: true})
            }
            //reload firestore data
            await getData()
            //change UI back to showing student data
            setIsUpdating(false)
            setShowStudentData(true)
        //catch any errors
        } catch (err) {
            console.log(err)
                setError("Unable to update student information right now.")
        //always disengage loading state
            } finally {
            setIsLoading(false)
        }
    }
    //function to delete student document and all associated subcollections and documents 
    async function callDeleteStudent(student) { 
        setIsLoading(true)
        try{
            //trigger cloud function with student path
            const res = await deleteStudent({path: "students/" + student.id})
            //update group student count
            const docRef2 = doc(db, "groups", student.group)
                await setDoc(docRef2, {
                    student_count: increment(-1),
                    code: globalData?.code || ""
                }, {merge: true})
            console.log(res.data)
            if (res.data.ok) {
                await getData(student)
                setIsDeleted(true)
            }
        } catch (err){
            console.log(err)
        } finally {
            setIsLoading(false)
        }
        
    }
    //function to manage use states for student data during updates
    function handleStatus(reset, student) {
        //if user is cancelling update action, reset states
        if (reset) {
            setName("")
            setYear(0)
            setDob("")
            setIsRegistered(false)
        }
        //if user is starting update action, set states to selected student data
        else {
            setName(student.name)
            setYear(student?.grade || student.group)
            setDob(student?.Dob || "")
            setIsRegistered(student.registered)
        }
    }
    return (
        <>
            {isLoading &&(<p>Loading...</p>)}
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
                    {error && (<div class="error"><p>❌ {error}</p></div>)}
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
                            <div class="is-submitted">
                                <p>✅ New student added successfully!</p>
                                <button class="edit-return-button" onClick={()=>{handleCloseModal()}}><i class="fa-solid fa-arrow-left"></i>Return</button>
                                <button class="edit-button" onClick={()=>{setIsSubmitted(false)}}>Add another student</button>
                            </div>
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
                                    ><p>{student.name} {student.registered ? "":"❗"}</p></button>)
                            }
                        })}
                        <h5>NOTE: an exclamation point ❗next to the student's name indicates they are not registered with the program.</h5>
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
                                    {selectedStudent.registered == false && (
                                        <div class="warning">
                                            <p>⚠️ This student is not registered. If you notice repeat attendance, please consider getting their parent to register them with GPC kids.</p>
                                        </div>
                                    )}
                                    <p><b>Name:</b> {selectedStudent.name}</p>
                                    <p><b>Date of Birth:</b> {selectedStudent.Dob}</p>
                                    <p><b>Year:</b> {selectedStudent.grade}</p>
                                    <p><b>Group:</b> {selectedStudent.group}</p>
                                    <p><b>Attendance:</b> {Math.round((selectedStudent.sessions_attended/selectedStudent.sessions_since_registered)*100) || 0}%</p>
                                    <div class="manage-students">
                                    <button class="edit-button" onClick={()=>{setIsUpdating(true), handleStatus(false, selectedStudent), setShowStudentData(false)}}><p>Edit Student Data</p></button>
                                        <button class="delete-student-button" onClick={()=>{callDeleteStudent(selectedStudent), setShowStudentData(false)}}><p>Delete Student</p></button>
                                    </div>
                                </div>
                            </>
                        )}
                        {isUpdating && (//render if specific student is being edited 
                            <>
                            <div class="student-data">
                                <p>Student Name</p>
                                <input value={name} onChange={(e)=>{setName(e.target.value)}} placeholder="Name"></input>
                                <p>Student Date of Birth</p>
                                <input value={Dob} onChange={(e)=>{setDob(e.target.value)}} placeholder="Date of Birth"></input>
                                <p>Student Current School Year</p>
                                <input value={year} onChange={(e)=>{setYear(e.target.value)}} placeholder="Year"></input>
                                <div class="registration-status">
                                <p>Student Registration Status: </p>
                                <button class={isRegistered ? "registered-button-true":"registered-button-false"} onClick={()=>{setIsRegistered(!isRegistered)}}>{isRegistered ? "Registered":"Unregistered"}</button>
                                </div>
                                <p class="warning">⚠️ Only set student status to registered after their parents have returned the registration form.</p>
                                <div class="manage-students">
                                    <button class="update-button" onClick={()=>{updateStudentData(selectedStudent)}}><p>Update</p></button>
                                    <button class="roll-button-Magnolias" onClick={()=>{setIsUpdating(false), setShowStudentData(true), handleStatus(true)}}><p>Cancel</p></button>
                                </div>
                            </div>
                            </>
                        )}
                        {isDeleted&&(//render if delete was successful 
                            <>
                                <div class="is-submitted">
                                    <button class="edit-return-button" onClick={()=>{
                                        setHasDecided(false), 
                                        setIsEdit(false), 
                                        setIsDeleted(false)}}><i class="fa-solid fa-arrow-left"></i>Return</button>
                                    <p>✅ Student deleted successfully</p>
                                </div>
                            </>
                        )}

                </>
            )}
        </>
    )
}