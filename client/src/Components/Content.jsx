import Presentation from './Presentation'
import User from './User'
import CallOption from './CallOption'
import Webcam from 'react-webcam'
import './Content.css';
import { useState } from 'react'

function Content() {
    const [CamVisible, setCamVisible] = useState(false);

  const onCamClicked = () => {
    setCamVisible(!CamVisible);
  }
    return(
        <>
            <div className='Content'>
                <div className="top">
                    <Presentation />
                </div>
                <div className={CamVisible ? 'bottom' : 'btm'}>
                    <div className='left'>
                        <div className='Profiles'>
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                            <User />
                        </div>
                        <div>
                            <CallOption func={onCamClicked}/>
                        </div>
                    </div>
                    {CamVisible && <Webcam mirrored={true} style={{width: '40%', borderRadius: '25px'}} />}
                </div>
            </div>
        </>
    );
}

export default Content