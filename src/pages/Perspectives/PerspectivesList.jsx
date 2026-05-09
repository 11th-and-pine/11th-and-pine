import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerspectives } from '../../services/dataService'

function PerspectivesList() {
  const navigate = useNavigate()
  const perspectives = getPerspectives()

  const [activeTab, setActiveTab] = useState('westlake')
  const [expandedId, setExpandedId] = useState('1')

  const westlake = perspectives.find(
    (p) =>
      p.featuredTitle === 'WESTLAKE PROTEST' ||
      p.name?.toLowerCase().includes('westlake') ||
      p.id === '1'
  )

  const capitalHillItems = perspectives.filter((p) => p.id !== westlake?.id)

  const getItems = () => {
    if (activeTab === 'westlake') return westlake ? [westlake] : []
    if (activeTab === 'capital') return capitalHillItems
    return capitalHillItems
  }

  const items = getItems()

  const handleCardClick = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div style={styles.page}>
      <div style={styles.scrollArea}>
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'westlake' ? styles.activeTab : {}),
            }}
            onClick={() => {
              setActiveTab('westlake')
              setExpandedId('1')
            }}
          >
            ♘ Westlake
          </button>

          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'capital' ? styles.activeTab : {}),
            }}
            onClick={() => {
              setActiveTab('capital')
              setExpandedId(capitalHillItems[0]?.id || null)
            }}
          >
            ☼ Capital Hill
          </button>

          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'labels' ? styles.activeTab : {}),
            }}
            onClick={() => {
              setActiveTab('labels')
              setExpandedId(null)
            }}
          >
            📍 Labels
          </button>
        </div>

        <div style={styles.content}>
          {items.map((p, index) => {
            const isExpanded = expandedId === p.id
            const progress = p.id === '1' ? 70 : index === 0 ? 5 : 0

            return (
              <div key={p.id} style={styles.card}>
                <div
                  style={styles.cardHeader}
                  onClick={() => handleCardClick(p.id)}
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={styles.thumbnail}
                  />

                  <div style={styles.cardHeaderText}>
                    <h2 style={styles.cardTitle}>
                      {p.featuredTitle === 'WESTLAKE PROTEST'
                        ? 'Westlake Protest'
                        : p.name === 'Jordan'
                          ? 'Protest & Conflict'
                          : 'Community & Support'}
                    </h2>

                    {p.name !== 'Westlake' && (
                      <p style={styles.cardSubtitle}>
                        From {p.name}’s View
                      </p>
                    )}
                  </div>

                  <span style={styles.chevron}>
                    {isExpanded ? '⌃' : '⌄'}
                  </span>
                </div>

                {isExpanded && (
                  <div style={styles.expandedContent}>
                    <p style={styles.description}>
                      {p.id === '1'
                        ? 'Walk through the heart of CHOP and listen to stories tied to the streets where events unfolded.'
                        : p.shortBio}
                    </p>

                    <div style={styles.progressBox}>
                      <div style={styles.progressTop}>
                        <span style={styles.progressLabel}>Walking Progress</span>
                        <span style={styles.progressPercent}>{progress}%</span>
                      </div>

                      <div style={styles.progressTrack}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div style={styles.buttonRow}>
                      <button
                        style={styles.primaryButton}
                        onClick={() => navigate('/map/walking')}
                      >
                        CONTINUE WALKING
                      </button>

                      <button
                        style={styles.secondaryButton}
                        onClick={() => navigate(`/perspectives/${p.id}`)}
                      >
                        MORE INFO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => navigate('/map/overview')}>
          <div style={styles.navIconInactive}>⌂</div>
          <span style={styles.navTextInactive}>Home</span>
        </button>

        <button style={styles.navButton} onClick={() => navigate('/perspectives')}>
          <div style={styles.navIconActive}>▰</div>
          <span style={styles.navTextActive}>Library</span>
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    height: '100%',
    backgroundColor: '#f4f6f8',
    display: 'flex',
    flexDirection: 'column',
    color: '#111827',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    padding: '58px 28px 0',
    backgroundColor: '#f4f6f8',
  },
  tab: {
    position: 'relative',
    padding: '0 0 14px',
    border: 'none',
    borderBottom: '3px solid #c7dcfb',
    background: 'transparent',
    color: '#b8d4fb',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  activeTab: {
    color: '#0054d8',
    borderBottom: '3px solid #0054d8',
  },
  content: {
    padding: '28px 18px 110px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    marginBottom: '22px',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    cursor: 'pointer',
  },
  thumbnail: {
    width: '46px',
    height: '46px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
    color: '#111',
    lineHeight: 1.1,
  },
  cardSubtitle: {
    margin: '6px 0 0',
    fontSize: '14px',
    color: '#587092',
  },
  chevron: {
    color: '#0054d8',
    fontSize: '24px',
    fontWeight: 700,
  },
  expandedContent: {
    padding: '0 16px 16px',
  },
  description: {
    margin: '6px 0 18px',
    fontSize: '14px',
    lineHeight: 1.25,
    color: '#777',
  },
  progressBox: {
    backgroundColor: '#f7f7f7',
    padding: '12px',
    marginBottom: '16px',
  },
  progressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#111',
  },
  progressPercent: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0054d8',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#d9d9d9',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0054d8',
    borderRadius: '999px',
  },
  buttonRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '12px',
  },
  primaryButton: {
    height: '34px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#064be8',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
  },
  secondaryButton: {
    height: '34px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#e8ebef',
    color: '#5c6675',
    fontSize: '12px',
    cursor: 'pointer',
  },
  bottomNav: {
    height: '76px',
    borderTop: '1px solid #e1e5ea',
    backgroundColor: '#f4f6f8',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    flexShrink: 0,
  },
  navButton: {
    border: 'none',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  navIconInactive: {
    fontSize: '26px',
    color: '#b7d5ff',
    lineHeight: 1,
  },
  navTextInactive: {
    fontSize: '11px',
    color: '#b7d5ff',
    marginTop: '4px',
  },
  navIconActive: {
    fontSize: '26px',
    color: '#0054ff',
    lineHeight: 1,
    transform: 'rotate(-16deg)',
  },
  navTextActive: {
    fontSize: '11px',
    color: '#0054ff',
    marginTop: '4px',
  },
}

export default PerspectivesList