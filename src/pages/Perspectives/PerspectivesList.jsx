import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerspectives } from '../../services/dataService'
import BottomNav from '../../components/BottomNav'
import perspectiveWestlakeIcon from '../../assets/images/perspective-westlake-icon.png'
import perspectiveChopIcon from '../../assets/images/perspective-chop-icon.svg'
import perspectiveLabelIcon from '../../assets/images/perspective-label-icon.png'
import labelMapImage from '../../assets/images/label-map.jpg'

const LABELS = [
  {
    id: 'poi-westlake-plaza',
    title: 'Old Building',
    address: 'xxxx Ave',
    desc: 'A quiet street that once held voices, gatherings, and stories. Walk closer to uncover the layered memories left behind.',
    imageUrl: labelMapImage,
  },
  {
    id: 'poi-pike-pine',
    title: 'Old Building',
    address: 'xxxx Ave',
    desc: 'A nearby site connected to community movement and public memory.',
    imageUrl: labelMapImage,
  },
  {
    id: 'poi-cal-anderson',
    title: 'Old Building',
    address: 'xxxx Ave',
    desc: 'A place marker for another layer of the walking archive.',
    imageUrl: labelMapImage,
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9L12 15L18 9"
          stroke={expanded ? '#C53E2C' : '#505F76'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function TabIcon({ src, active, style }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        ...style,
        opacity: active ? 1 : 0.45,
        filter: active ? 'none' : 'saturate(0.45) brightness(1.12)',
      }}
    />
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

  const startWalking = () => {
    navigate('/map/navigate')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)

    if (tab === 'westlake') setExpandedId(westlake?.id || null)
    if (tab === 'capital') setExpandedId(capitalHillItems[0]?.id || null)
    if (tab === 'labels') setExpandedId('poi-westlake-plaza')
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
            <TabIcon
              src={perspectiveWestlakeIcon}
              active={activeTab === 'westlake'}
              style={styles.westlakeTabIcon}
            />
            <span style={styles.tabText}>Westlake</span>
          </button>

          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'capital' ? styles.activeTab : {}),
            }}
            onClick={() => handleTabChange('capital')}
          >
            <TabIcon
              src={perspectiveChopIcon}
              active={activeTab === 'capital'}
              style={styles.chopTabIcon}
            />
            <span style={styles.tabText}>Capitol Hill</span>
          </button>

          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'labels' ? styles.activeTab : {}),
            }}
            onClick={() => handleTabChange('labels')}
          >
            <TabIcon
              src={perspectiveLabelIcon}
              active={activeTab === 'labels'}
              style={styles.labelTabIcon}
            />
            <span style={styles.tabText}>Labels</span>
          </button>

          <div style={styles.tabConnectorLine} />

          <div style={styles.tabUnderlineWrap}>
            {['westlake', 'capital', 'labels'].map((tab) => (
              <div key={tab} style={styles.tabUnderlineSlot}>
                <div
                  style={{
                    ...styles.tabUnderline,
                    ...(activeTab === tab ? styles.tabUnderlineActive : {}),
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={styles.content}>
          {activeTab === 'westlake' && westlake && (
            <RouteCard
              item={westlake}
              expanded={expandedId === westlake.id}
              onToggle={() => handleCardClick(westlake.id)}
              onMoreInfo={() => navigate(`/perspectives/${westlake.id}`)}
              onContinue={startWalking}
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
                onContinue={startWalking}
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

      <BottomNav active="library" className="library-bottom-nav" />
    </div>
  )
}

function RouteCard({
  item,
  expanded,
  onToggle,
  onMoreInfo,
  onContinue,
  title,
  subtitle,
  progress,
}) {
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
    <div style={expanded ? styles.labelCardExpanded : styles.labelCard}>
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
          <div style={styles.labelDivider} />
          <p style={styles.labelDesc}>{label.desc}</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    height: '100%',
    backgroundColor: '#F3F3F1',
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
    gridTemplateColumns: '105px 105px 105px',
    columnGap: '12px',
    alignItems: 'end',
    justifyContent: 'center',
    padding: '42px 0 0',
    backgroundColor: '#F3F3F1',
    position: 'relative',
  },
  tab: {
    height: 34,
    minWidth: 0,
    padding: '0 0 10px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(197, 62, 44, 0.45)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
    position: 'relative',
    zIndex: 2,
  },
  activeTab: {
    color: '#C53E2C',
  },
  tabText: {
    color: 'currentColor',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
  },
  westlakeTabIcon: {
    width: '30px',
    height: '20px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  chopTabIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  labelTabIcon: {
    width: '20px',
    height: '20px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  tabConnectorLine: {
    position: 'absolute',
    left: '31px',
    right: '60px',
    bottom: 0,
    height: '1px',
    backgroundColor: 'rgba(197, 62, 44, 0.40)',
    zIndex: 0,
  },
  tabUnderlineWrap: {
    position: 'absolute',
    left: '31px',
    right: '31px',
    bottom: 0,
    display: 'grid',
    gridTemplateColumns: '97px 97px 97px',
    columnGap: '20px',
    zIndex: 1,
  },
  tabUnderlineSlot: {
    width: '97px',
  },
  tabUnderline: {
    height: '3px',
    width: '97px',
    backgroundColor: 'rgba(197, 62, 44, 0.40)',
  },
  tabUnderlineActive: {
    backgroundColor: '#C53E2C',
  },

  content: {
    padding: '30px 31px 110px',
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
    color: '#111',
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
    backgroundColor: '#EED05D',
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
    backgroundColor: '#C53E2C',
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
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 2px rgba(161, 161, 161, 0.25)',
    overflow: 'hidden',
  },
  labelCardExpanded: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 2px rgba(161, 161, 161, 0.25)',
    overflow: 'hidden',
  },
  labelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '16px 16px 14px',
    cursor: 'pointer',
  },
  labelThumbnail: {
    width: '48px',
    height: '48px',
    borderRadius: '4px',
    objectFit: 'cover',
    opacity: 0.9,
    flexShrink: 0,
  },
  labelText: {
    flex: 1,
    minWidth: 0,
  },
  labelTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 500,
    color: '#000',
  },
  labelAddress: {
    margin: '10px 0 0',
    fontSize: '14px',
    fontWeight: 400,
    color: '#505F76',
  },
  labelExpanded: {
    padding: '0 23px 20px',
  },
  labelDivider: {
    width: '100%',
    height: '1px',
    backgroundColor: '#505F76',
    margin: '0 0 22px',
  },
  labelDesc: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '15.68px',
    color: '#505F76',
  },
}

export default PerspectivesList