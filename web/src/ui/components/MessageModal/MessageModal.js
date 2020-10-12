import React from 'react'
import './MessageModal.scss'

const MessageModal = ({ children, onClose = () => {} }) => (
  <>
    <div
      className="faded"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    />
    <div className="MessageModal">
      <div
        className="modal modal-blur fade show"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <div
          className="modal-dialog"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="modal-content">{children}</div>
        </div>
      </div>
    </div>
  </>
)

export default MessageModal
