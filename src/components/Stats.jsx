

import { collection, getDocs, query, where } from "firebase/firestore"
import { useEffect, useMemo, useState } from "react"
import { db } from "../../firebase";

export default function Stats() {
    const [sessionData, setSessionData] = useState([])
    const [targetGroup, setTargetGroup] = useState("")
    const [targetRange, setTargetRange] = useState("")
    const [groups, setGroups] = useState([])
    const times = useMemo(()=>{
        const now = Date.now()
        return [
            {label:"Last Week", time: now-604800000},
            {label:"Last Month", time: now-2.628e+9},
            {label:"Last Year", time: now-3.154e+10},
            {label: "All Time", time: 0}
        ]
    }, [])
    
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
    async function fetchSessionData() {
            try {
                console.log(targetRange)
                const docRef = collection(db, "sessions")
                const q = query(
                    docRef,
                    where("timestamp", ">=",targetRange)
                )
                //create empty array for data
                const data = []
                //push each query docs from the last 7 days
                const querySnapshot = await getDocs(q)
                //push session data into data array
                querySnapshot.forEach((doc)=>{
                    data.push({id: doc.id, ...doc.data()})
                })

                console.log("Query returned:", data)
                return data
            } catch (err) {
                console.log("Error fetching data:", err)
                return []
            }
        }
    useEffect(()=>{ 
            async function getGroups(){
                //call fetchData to send query to firestore
                const data3 = await fetchData("groups")
                setGroups(data3)
            }
            getGroups()           
        }, [])
    useEffect(()=>{
        if (!Number.isFinite(targetRange)) return
        async function getSessions() {
            const data2 = await fetchSessionData()
                //update useState to be mapped below
                setSessionData(data2)
        }
        getSessions()
    }, [targetRange])
    return (
        <>
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