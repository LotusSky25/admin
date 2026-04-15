import { useAuth } from "../context/AuthContext"

export default function Church(){

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