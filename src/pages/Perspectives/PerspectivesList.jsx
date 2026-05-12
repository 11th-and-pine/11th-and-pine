import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerspectives } from '../../services/dataService'

const LABELS = [
  {
    id: 'label-1',
    title: 'Old Building',
    address: 'xxxx Ave',
    desc: 'A quiet street that once held voices, gatherings, and stories. Walk closer to uncover the layered memories left behind.',
    imageUrl: 'src/assets/images/label-map.jpg',
  },
  {
    id: 'label-2',
    title: 'Old Building',
    address: 'bbbb Ave',
    desc: 'A nearby site connected to community movement and public memory.',
    imageUrl: 'src/assets/images/label-map.jpg',
  },
  {
    id: 'label-3',
    title: 'Old Building',
    address: 'cccc Ave',
    desc: 'A place marker for another layer of the walking archive.',
    imageUrl: 'src/assets/images/label-map.jpg',
  },
]

function ChevronIcon({ expanded }) {
  return (
    <span
      style={{
        ...styles.chevron,
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9L12 15L18 9"
          stroke="#0054d8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

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

  const handleTabChange = (tab) => {
    setActiveTab(tab)

    if (tab === 'westlake') setExpandedId(westlake?.id || null)
    if (tab === 'capital') setExpandedId(capitalHillItems[0]?.id || null)
    if (tab === 'labels') setExpandedId(null)
  }

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
            onClick={() => handleTabChange('westlake')}
          >
            ♘ Westlake
          </button>

          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'capital' ? styles.activeTab : {}),
            }}
            onClick={() => handleTabChange('capital')}
          >
            ☼ Capital Hill
          </button>

          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'labels' ? styles.activeTabLabel : {}),
            }}
            onClick={() => handleTabChange('labels')}
          >
            📍 Labels
          </button>
        </div>

        <div style={styles.content}>
          {activeTab === 'westlake' && westlake && (
            <RouteCard
              item={westlake}
              expanded={expandedId === westlake.id}
              onToggle={() => handleCardClick(westlake.id)}
              onMoreInfo={() => navigate(`/perspectives/${westlake.id}`)}
              onContinue={() => navigate('/map/walking')}
              title="Westlake Protest"
              subtitle=""
              progress={70}
            />
          )}

          {activeTab === 'capital' &&
            capitalHillItems.map((p, index) => (
              <RouteCard
                key={p.id}
                item={p}
                expanded={expandedId === p.id}
                onToggle={() => handleCardClick(p.id)}
                onMoreInfo={() => navigate(`/perspectives/${p.id}`)}
                onContinue={() => navigate('/map/walking')}
                title={index === 0 ? 'Protest & Conflict' : 'Community & Support'}
                subtitle={`From ${p.name}’s View`}
                progress={index === 0 ? 5 : 0}
              />
            ))}

          {activeTab === 'labels' &&
            LABELS.map((label) => (
              <LabelCard
                key={label.id}
                label={label}
                expanded={expandedId === label.id}
                onToggle={() => handleCardClick(label.id)}
              />
            ))}
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

function RouteCard({ item, expanded, onToggle, onMoreInfo, onContinue, title, subtitle, progress }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader} onClick={onToggle}>
        <img src={item.imageUrl} alt={item.name} style={styles.thumbnail} />

        <div style={styles.cardHeaderText}>
          <h2 style={styles.cardTitle}>{title}</h2>
          {subtitle && <p style={styles.cardSubtitle}>{subtitle}</p>}
        </div>

        <ChevronIcon expanded={expanded} />
      </div>

      {expanded && (
        <div style={styles.expandedContent}>
          <p style={styles.description}>{item.shortBio || item.fullBio}</p>

          <div style={styles.progressBox}>
            <div style={styles.progressTop}>
              <span style={styles.progressLabel}>Walking Progress</span>
              <span style={styles.progressPercent}>{progress}%</span>
            </div>

            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button style={styles.primaryButton} onClick={onContinue}>
  {progress === 0 ? 'START WALKING' : 'CONTINUE WALKING'}
</button>

            <button style={styles.secondaryButton} onClick={onMoreInfo}>
              MORE INFO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LabelCard({ label, expanded, onToggle }) {
  return (
    <div style={styles.labelCard}>
      <div style={styles.labelHeader} onClick={onToggle}>
        <img
          src={label.imageUrl}
          alt={label.title}
          style={styles.labelThumbnail}
        />

        <div style={styles.labelText}>
          <h2 style={styles.labelTitle}>{label.title}</h2>
          <p style={styles.labelAddress}>{label.address}</p>
        </div>

        <ChevronIcon expanded={expanded} />
      </div>

      {expanded && (
        <div style={styles.labelExpanded}>
          <p style={styles.labelDesc}>{label.desc}</p>

          <div style={styles.labelImageWrap}>
            <img
              src={label.imageUrl}
              alt={label.title}
              style={styles.labelLargeImage}
            />
          </div>
        </div>
      )}
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
  activeTabLabel: {
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
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'transform 0.2s ease',
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
  labelCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    marginBottom: '18px',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
  },
  labelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    cursor: 'pointer',
  },
  labelThumbnail: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  labelText: {
    flex: 1,
    minWidth: 0,
  },
  labelTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
    color: '#111',
  },
  labelAddress: {
    margin: '4px 0 0',
    fontSize: '14px',
    fontWeight: 700,
    color: '#b7d5ff',
  },
  labelExpanded: {
    padding: '0 18px 18px',
  },
  labelDesc: {
    margin: '0 0 12px',
    fontSize: '14px',
    lineHeight: 1.25,
    color: '#8b8b8b',
  },
  labelImageWrap: {
    position: 'relative',
    height: '470px',
    borderRadius: '26px',
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)',
  },
  labelLargeImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
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