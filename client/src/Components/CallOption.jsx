/* eslint-disable react/prop-types */
import './CallOption.css';
import Icons from './Icons';
import mic from '../assets/mic.svg';
import micOff from '../assets/mic-off.svg';
import Cast from '../assets/Cast.svg';
import EndCall from '../assets/EndCall.svg';
import videocam from '../assets/videocam.svg';
import videoCamOff from '../assets/videocam_off.svg';
import moreOption from '../assets/moreOption.svg';
import { useEffect, useState } from 'react';

function CallOption({turnOn , setTurnOn}) {

    const [micIcon, setMicIcon] = useState("");
    const [camIcon, setCamIcon] = useState("");
    
    const micClicked = () => {
        if (micIcon == mic) {
            setMicIcon(micOff);
        } else {
            setMicIcon(mic);
        }
    }
    
    const camClicked = () => {
        if (camIcon == videocam) {
            setCamIcon(videoCamOff);
            setTurnOn(false)
        } else {
            setCamIcon(videocam);
            setTurnOn(true)
        }
    }

    useEffect(()=>{
        if (turnOn) {
            localStorage.setItem("on" , "false")
        } else {
            localStorage.setItem("on" , "true")
        }
       

    } , [turnOn])

    return (
        <>
            <div className="IconCard">
                <Icons icon={moreOption} />
                <Icons icon={Cast} />
                <Icons icon={camIcon == "" ? videocam : camIcon} click={camClicked} />
                <Icons icon={micIcon == "" ? mic : micIcon} click={micClicked} />
                <Icons icon={EndCall} red={true} />
            </div>
        </>
    );
}

export default CallOption;