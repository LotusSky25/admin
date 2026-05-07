import { useAuth } from "../context/AuthContext"
//display code for admin reference 
export default function Church(){
    //get global data from auth hook
    const {globalData} = useAuth()
    const code = getCode()
    
    function getCode() {
        if (globalData != null) {
            return (globalData.code)
        }
        else {
            return ('')
        }
    }

    return (
        <>
            <div class="church-content">
                <p>Church code: {code}</p>
            </div>
        </>
    )
}