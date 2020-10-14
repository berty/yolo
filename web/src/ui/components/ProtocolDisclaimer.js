import React from 'react'
import MessageModal from './MessageModal/MessageModal'

const ProtocolDisclaimer = ({ closeAction }) => {
  const DisclaimerMessage = () => (
    <>
      <div className="modal-header">
        {/* <h5 className="modal-title">🚧 Disclaimer 🚧</h5> */}
        <button
          type="button"
          className="close"
          data-dismiss="modal"
          aria-label="Close"
          onClick={closeAction}
          style={{ position: 'absolute', top: 15, right: 15 }}
        />
      </div>
      <div className="modal-body">
        <h5 style={{ whiteSpace: 'nowrap', marginBottom: '30px' }}>
          🚧 Disclaimer 🚧
        </h5>
        Yolo does NOT use Berty Protocol yet.
        {' '}
        <br />
        Don't send nudes
        {' '}
        <span role="img" aria-label="Wink">
          😉
        </span>
      </div>
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-sm btn-shadow"
          data-dismiss="modal"
          onClick={closeAction}
        >
          OK
        </button>
      </div>
    </>
  )
  return (
    <MessageModal>
      <DisclaimerMessage />
    </MessageModal>
  )
}

export default ProtocolDisclaimer
