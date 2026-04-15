import Modal1 from "./Modal1"
import Auth from "./Auth"
import download from "../assets/download.png"
import {useAuth}from '../context/AuthContext'
import Church from "./Church"
import { useState } from "react"

export default function Layout(props) {
    const { children } = props
    const { globalUser, logout} = useAuth()
    const header = (
        <header>
            <div>
                <h1>GPC Kids</h1>
                <p>The attendance tracker for Glendowie Presbyterian Church </p>
                    {globalUser ? (<button class="logout-button" onClick={logout}>Logout</button>):''}
                <div class="header-actions">   
                    {globalUser &&(<Church></Church>)}
                </div>
            </div>
            <img src={download}/>
        </header>
    )

    const footer = (
        <footer>
            <p class="footer-text">Glendowie Presbyterian Church 2026</p>
        </footer>
    )
    return (
        <>
            { header }
            <main>
                { children }
            </main>
            { footer }
        </>
    )
}