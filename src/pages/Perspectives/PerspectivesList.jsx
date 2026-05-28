import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerspectives } from '../../services/dataService'
import BottomNav from '../../components/BottomNav'
import perspectiveWestlakeIcon from '../../assets/images/tab-westlake-icon.png'
import perspectiveChopIcon from '../../assets/images/tab-capitol-hill-icon.svg'
import perspectiveLabelIcon from '../../assets/images/tab-labels-icon.png'
import labelMapImage from '../../assets/images/label-paramount-theatre.jpg'
import labelMapImage3 from '../../assets/images/label-westlake-tower.jpg'
import labelMapImage4 from '../../assets/images/Cal_Anderson_Park.jpg'
import seattlePoliceDepartmentImage from '../../assets/images/label-east-precinct.jpg'

const LABELS = [
  {
    id: 'poi-paramount-theatre',
    title: 'Paramount Theatre',
    address: '911 Pine St',
    position: [47.613380, -122.331806],
    desc: 'A historic gathering place where entertainment, culture, and public life intersected in downtown Seattle. Explore how this landmark connects to stories of community, performance, and change.',
    imageUrl: labelMapImage,
  },
  {
    id: 'poi-westlake-tower',
    title: 'Westlake Tower',
    address: '1601 5th Ave',
    position: [47.61246495850918, -122.33745074674492],
    desc: 'A landmark of Seattle’s changing skyline that reflects the city’s growth and shifting identity. Experience stories connected to development, memory, and life in downtown Seattle.',
    imageUrl: labelMapImage3,
  },
  {
    id: 'poi-cal-anderson-park',
    title: 'Cal Anderson Park',
    address: '1635 11th Ave',
    position: [47.615353, -122.319993],
    desc: 'A central public park in Capitol Hill and a gathering point that became the heart of CHOP during the summer of 2020. Named for Washington’s first openly gay state legislator, it remains a site of community memory and mobilization.',
    imageUrl: labelMapImage4,
  },
  {
    id: 'poi-east-precinct',
    title: 'Seattle Police Department — East Precinct',
    address: '1519 12th Ave, Capitol Hill',
    position: [47.61507932004624, -122.31704771348437],
    desc: 'During the 2020 CHOP protests, the East Precinct became one of the defining sites of the occupation. After police temporarily left the building, the surrounding blocks became a protest zone filled with community organizing, mutual aid, art, and public debate over policing and public space.',
    imageUrl: seattlePoliceDepartmentImage,
  },
]

const CAPITOL_ROUTES = {
  2: {
    id: 1,
    title: "Alex's Route",
    cardTitle: 'Queer Care & Protest',
    color: '#EED05D',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.618724352103335, -122.32003383177313],
      [47.6186916006176, -122.31948316444459],
      [47.6183586260147, -122.31872194784339],
      [47.61810752901002, -122.31941028200404],
    ],
  },
  3: {
    id: 2,
    title: "Jordan's Route",
    cardTitle: 'Resident Witness',
    color: '#8b5cf6',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.616353487308146, -122.31971489484106],
      [47.61803690317238, -122.31941907806251],
      [47.618674847206655, -122.320057007748],
    ],
  },
  4: {
    id: 3,
    title: "Sam's Route",
    cardTitle: 'Black Witness',
    color: '#22c55e',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.61537792391303, -122.31834587334546],
      [47.615328, -122.318167],
      [47.61644970344747, -122.31829245310354],
      [47.618667480923264, -122.3183265120806],
      [47.61871203860535, -122.31707799892192],
    ],
  },
  5: {
    id: 4,
    title: "Tiana's Route",
    cardTitle: 'Mutual Aid & Care',
    color: '#06b6d4',
    path: [
      [47.61534637433494, -122.31998484534672],
      [47.61537792391303, -122.31834587334546],
      [47.615189438501694, -122.318284960829],
      [47.61518751104897, -122.31702045803209],
      [47.61507232602374, -122.31699950222341],
      [47.615104, -122.316990],
      [47.61507932004624, -122.31704771348437],
      [47.616317, -122.317007],
    ],
  },
}

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
  const [imagePreviewLabel, setImagePreviewLabel] = useState(null)

  const westlake = perspectives.find(
    (p) =>
      p.featuredTitle === 'WESTLAKE PROTEST' ||
      p.name?.toLowerCase().includes('westlake') ||
      p.id === '1'
  )

  const capitalHillItems = perspectives.filter((p) => p.id !== westlake?.id)

  const startWalking = (route = null) => {
    navigate('/map/navigate', route ? { state: { route, guideToStart: true } } : undefined)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setImagePreviewLabel(null)

    if (tab === 'westlake') setExpandedId(westlake?.id || null)
    if (tab === 'capital') setExpandedId(capitalHillItems[0]?.id || null)
    if (tab === 'labels') setExpandedId('poi-paramount-theatre')
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
              onContinue={() => startWalking()}
              title="Westlake Protest"
              subtitle=""
              progress={0}
            />
          )}

          {activeTab === 'capital' &&
            capitalHillItems.map((p) => (
              <RouteCard
                key={p.id}
                item={p}
                expanded={expandedId === p.id}
                onToggle={() => handleCardClick(p.id)}
                onMoreInfo={() => navigate(`/perspectives/${p.id}`)}
                onContinue={() => startWalking(CAPITOL_ROUTES[p.id])}
                title={CAPITOL_ROUTES[p.id]?.cardTitle || 'Community & Support'}
                subtitle={`From ${p.name}’s View`}
                progress={0}
              />
            ))}

          {activeTab === 'labels' &&
            LABELS.map((label) => (
              <LabelCard
                key={label.id}
                label={label}
                expanded={expandedId === label.id}
                onToggle={() => handleCardClick(label.id)}
                onOpenImage={() => setImagePreviewLabel(label)}
              />
            ))}
        </div>
      </div>

      <BottomNav active="library" className="library-bottom-nav" />

      {imagePreviewLabel && (
        <div style={styles.imageOverlay} onClick={() => setImagePreviewLabel(null)}>
          <div style={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <img
              src={imagePreviewLabel.imageUrl}
              alt={imagePreviewLabel.title}
              style={styles.modalImage}
            />

            <button
              style={styles.closeButton}
              onClick={() => setImagePreviewLabel(null)}
            >
              ×
            </button>

            <div style={styles.modalGradient} />

            <div style={styles.modalText}>
              <h2 style={styles.modalTitle}>{imagePreviewLabel.title}</h2>
              <p style={styles.modalDesc}>{imagePreviewLabel.desc}</p>
            </div>
          </div>
        </div>
      )}
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
              START WALKING
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

function LabelCard({ label, expanded, onToggle, onOpenImage }) {
  return (
    <div style={expanded ? styles.labelCardExpanded : styles.labelCard}>
      <div style={styles.labelHeader} onClick={onToggle}>
        <img
          src={label.imageUrl}
          alt={label.title}
          style={styles.labelThumbnail}
          onClick={(e) => {
            e.stopPropagation()
            onOpenImage()
          }}
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
    position: 'relative',
    height: '100%',
    backgroundColor: '#F3F3F1',
    display: 'flex',
    flexDirection: 'column',
    color: '#111827',
    overflow: 'hidden',
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
    height: 20,
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
    gap: '0px',
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
    width: '32px',
    height: '30px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  chopTabIcon: {
    width: '18px',
    height: '20px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  labelTabIcon: {
    width: '24px',
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
    cursor: 'pointer',
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

  imageOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 3000,
    backgroundColor: 'rgba(0,0,0,0.08)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '205px',
    pointerEvents: 'auto',
  },
  imageModal: {
    position: 'relative',
    width: '297px',
    height: '461px',
    borderRadius: '0 0 36px 36px',
    overflow: 'hidden',
    boxShadow: '0 18px 28px rgba(0,0,0,0.28)',
    backgroundColor: '#000',
  },
  modalImage: {
    width: '297px',
    height: '461px',
    objectFit: 'cover',
    display: 'block',
  },
  modalGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '190px',
    background:
      'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.35), rgba(0,0,0,0))',
    backdropFilter: 'blur(3px)',
  },
  closeButton: {
    position: 'absolute',
    top: '18px',
    right: '18px',
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: '42px',
    lineHeight: '28px',
    cursor: 'pointer',
    zIndex: 2,
  },
  modalText: {
    position: 'absolute',
    left: '26px',
    right: '24px',
    bottom: '42px',
    color: '#fff',
    zIndex: 2,
  },
  modalTitle: {
    margin: '0 0 12px',
    fontSize: '34px',
    lineHeight: 1,
    fontWeight: 800,
  },
  modalDesc: {
    margin: 0,
    fontSize: '22px',
    lineHeight: 1.1,
    fontWeight: 400,
  },
}

export default PerspectivesList
