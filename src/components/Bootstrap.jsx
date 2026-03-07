import {useEffect} from 'react'
import {httpsCallable, getFunctions} from 'firebase/functions'
import { app} from '../../firebase'
import {onAuthStateChanged, getAuth} from 'firebase/auth'

export function Bootstrap() {
    //run on page load
    useEffect(()=>{
        //get necessary cloud function from app
        const auth = getAuth(app)
        const functions = getFunctions(app)
        //get the addFirstAdmin function specifically
        const bootstrapFirstAdmin = httpsCallable(functions, 'addFirstAdmin')
        //side effect that runs on mount 
        const unsubscribe = onAuthStateChanged(auth, async(user)=>{
            if (!user) return

            try {
                const res = await bootstrapFirstAdmin({})
                console.log(res.data)

            } catch(err){
                console.log(err)
            } finally {
                unsubscribe()
            }
        })
        //clean up the side effect to prevent memory leaks + performance issues 
        //this needs to go ouside the unsubscribe!!
        return () => unsubscribe()
    },[])
    return null
}