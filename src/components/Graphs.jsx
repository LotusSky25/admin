import { collection, getDocs} from "firebase/firestore"
import { db } from "../../firebase"
import { useEffect } from "react"
import { useState } from "react"

export default function Graphs(){

    const attendance_threshold = 20
    const [studentData, setStudentData] = useState([])
    const [error, setError] = useState("")

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
            if (err?.code === "permission-denied") {
                setError("Insufficient database permissions.")
            } else {
                setError("Unable to load data right now.")
            }
            return []
        }
    }
    useEffect(()=>{ 
            async function getData(){
                //call fetchData to send query to firestore
                const data3 = await fetchData("students")
                setStudentData(data3 || [])
            }
            getData()           
    }, [])

    const studentsWithLowAttendance = studentData.filter((student) => {
        const attendance = (student.sessions_attended / student.sessions_since_registered) * 100 || 0
        return attendance < attendance_threshold && attendance !== 0
    })
     
    return (
        <>
            {error !="" &&(<p><div class="error"><p>❌ {error}</p></div></p>)}
            <hr/>
            <h2>Students with attendance less than {attendance_threshold}%</h2>
            <div class="manage-students">
                {studentsWithLowAttendance.length === 0 && (
                    <div class="manage-students">
                        <p>Nothing to display here 🐝</p>
                    </div>
                )}
                {studentsWithLowAttendance.map((student) => {
                    const attendance = (student.sessions_attended / student.sessions_since_registered) * 100 || 0
                    return (
                        <div class="students-warning" key={student.id}>
                            <p>⚠️ <b>{student.name}</b>, {attendance}%</p>
                        </div>
                    )
                })}
            </div>

        </>
    )
}