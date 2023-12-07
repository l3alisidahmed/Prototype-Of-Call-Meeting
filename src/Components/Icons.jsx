import PropTypes from 'prop-types';
import './Icons.css';

function Icons({ icon, red, click}) {
    return (
        <>
        <div className="IconCircle" style={{ backgroundColor: red ? '#E55454' : '#D9D9D9' }} onClick={click}>
            <img src={icon} alt="Icon" className="icon" />
        </div>
        </>
    );
}

Icons.propTypes = {
    icon: PropTypes.string.isRequired,
    red: PropTypes.bool,
    click: PropTypes.func,
};

export default Icons;