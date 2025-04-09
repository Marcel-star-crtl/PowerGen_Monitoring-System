import React from 'react';
import ReactModal from 'react-modal';
import './modal.css'; 

const Modal = ({ isOpen, onRequestClose, image }) => {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Image Modal"
      ariaHideApp={false}
      className="modal-content" 
      overlayClassName="modal-overlay" 
    >
      <img src={image} alt="Modal Image" className="modal-image" /> 
      <button onClick={onRequestClose} className="modal-close-button">&#x2716;</button> 
    </ReactModal>
  );
};

export default Modal;
