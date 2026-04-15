
import { collection, getDocs, query, where } from "firebase/firestore"
import { useEffect, useMemo, useState } from "react"
import { db } from "../../firebase";

export default function Stats() {
    const [sessionData, setSessionData] = useState([])
    const [targetGroup, setTargetGroup] = useState("")
    const [targetRange, setTargetRange] = useState("")
    const [error, setError ] =useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [groups, setGroups] = useState([])
    const [referenceNow] = useState(() => Date.now())
    const times = useMemo(()=>{
        return [
            {label:"Last Week", time: referenceNow-604800000},
            {label:"Last Month", time: referenceNow-2.628e+9},
            {label:"Last Year", time: referenceNow-3.154e+10},
            {label: "All Time", time: 0}
        ]
    }, [referenceNow])
    
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
            async function getGroups(){
                //call fetchData to send query to firestore
                const data3 = await fetchData("groups")
                setGroups(data3 || [])
            }
            getGroups()           
        }, [])
    useEffect(()=>{
        if (!Number.isFinite(targetRange)) return
        async function getSessions() {
            setIsLoading(true)
            try {
                const docRef = collection(db, "sessions")
                const q = query(
                    docRef,
                    where("timestamp", ">=", targetRange)
                )
                const data = []
                const querySnapshot = await getDocs(q)
                querySnapshot.forEach((doc)=>{
                    data.push({id: doc.id, ...doc.data()})
                })
                setError("")
                setSessionData(data)
            } catch (err) {
                console.log("Error fetching data:", err)
                if (err?.code === "permission-denied") {
                    setError("Insufficient database permissions.")
                } else {
                    setError("Unable to load data right now.")
                }
                setSessionData([])
            } finally {
                setIsLoading(false)
            }
                //update useState to be mapped below
        }
        getSessions()
    }, [targetRange])
    return (
        <>
            {error && (
                <div class="error">
                    <p>❌ {error}</p>
                </div>
            )}
            <h2>Check attendance data</h2>
            <div class="display-attendance">
                <div class="select-timeframe">
                    <h3>Select timeframe</h3>
                    <select onChange={(e)=>setTargetRange(Number(e.target.value))}>
                        <option value="">Select..</option>
                        {times.map(function(option, idx) {
                            return(
                                <option key={idx} value={option.time}>{option.label}</option>
                            )
                        })}
                    </select>
                </div>
                <div class="select-group">
                    <h3>Select group</h3>
                    <select onChange={(e)=>{setTargetGroup(e.target.value)}}>
                    <option value="">Select..</option>
                        {groups.map(function(group, idx){
                            return(
                                <option key={idx} value={group.group}>{group.group}</option>
                            )
                        })}
                    </select>
                </div>
            </div>
            {isLoading && (<p>Loading...</p>)}
            {sessionData.map(function(session) {
                console.log(session)
                return(
                    <table key={session.id}>
                        <thead>
                            <tr>
                                <th>{session.id}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {session[targetGroup]?.map(function(student, idx){
                                return(
                                    <tr key={idx}>
                                        <td>{student.name}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )
            })}
            
        </>
    )
}