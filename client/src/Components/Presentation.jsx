import './Presentation.css';
import Webcam from 'react-webcam';

function Presentation () {
    const on = false;
    return (
        <>
            {on ? <Webcam className='WebCam'/> : <div className='WebCam' style={{backgroundColor: '#264653', width: '90%', height: '90%'}}></div>}
            
        </>
    );
}

export default Presentation