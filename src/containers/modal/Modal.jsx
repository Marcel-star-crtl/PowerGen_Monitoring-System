import React from 'react';
import ReactModal from 'react-modal';
import './modal.css'; 

const Modal = ({ isOpen, onRequestClose, image }) => {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="modal"
      overlayClassName="overlay"
    >
      <img src={image} alt="Magnified Image" className="modal-image"/>
    </ReactModal>
  );
};

export default Modal;
