import React, { useContext } from 'react'
import { X } from 'react-feather'
import { ThemeContext } from '../../../store/ThemeStore'
import styles from './FilterModal.module.scss'

const FilterModalWrapper = ({ closeAction, children }) => {
  const { theme, widgetStyles } = useContext(ThemeContext)

  const tablerOverrides = {
    modalStyle: {
      paddingRight: '1rem', display: 'block', width: '100vw', overflowY: 'auto',
    },
    modalTitleStyle: { fontSize: 'larger', color: theme.text.sectionTitle },
    modalHeaderStyle: { borderBottom: 'none' },
    modalContentStyle: {
      borderRadius: '1rem', border: 'none', padding: '1rem', color: theme.text.sectionText, backgroundColor: theme.bg.page,
    },
  }

  return (
    <>
      <div className="faded" />
      <span className="FilterModalWrapper">
        <div
          className="modal modal-blur fade show modal-open"
          role="dialog"
          aria-modal="true"
          style={tablerOverrides.modalStyle}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            role="document"
          >
            <div className="modal-content tabler-override" style={tablerOverrides.modalContentStyle}>
              <div className="modal-header" style={tablerOverrides.modalHeaderStyle}>
                <h5 className="modal-title tabler-override" style={tablerOverrides.modalTitleStyle}>
                  Filter the builds
                </h5>
                <div
                  className={styles['btn-close']}
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={closeAction}
                  style={widgetStyles.widgetBg}
                >
                  <X
                    size={14}
                    strokeWidth={3}
                    color={theme.icon.filterSelectedAccent}
                  />
                </div>
              </div>
              <div className="modal-body">
                {children}
              </div>
            </div>
          </div>
        </div>
      </span>
    </>
  )
}

export default FilterModalWrapper
