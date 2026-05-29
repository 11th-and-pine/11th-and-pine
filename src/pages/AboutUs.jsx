import { useNavigate } from 'react-router-dom'
import NavCircleButton from '../components/NavCircleButton'

export default function AboutUs() {
  const navigate = useNavigate()

  return (
    <div className="about-page">
      <NavCircleButton
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: 'calc(24px + var(--safe-top, 0px))',
          left: 24,
          zIndex: 2,
        }}
      />

      <main className="about-content">
        <section className="about-hero">
          <p className="about-kicker">About 11th & Pine</p>
          <p>
            11th & Pine is a 2026 University of Washington Informatics
            capstone project by Juicy Jam, sponsored by the UW School of Drama.
            It maps stories from the 2020 CHOP protests onto the streets,
            parks, and civic spaces where those events unfolded.
          </p>
        </section>

        <section className="about-card">
          <p>
            This version is built with Mapbox. The UW School of Drama will
            continue developing the full experience on the ECHOES platform,
            with an expected launch in 2027.
          </p>
        </section>

        <section className="about-card">
          <h2>Contact</h2>
          <p>
            For questions about this project, contact Yifan Ji at{' '}
            <a href="mailto:yifanj6@uw.edu">yifanj6@uw.edu</a> (Juicy Jam) or
            our UW School of Drama sponsors, Adrienne Mackey (
            <a href="mailto:amackey1@uw.edu">amackey1@uw.edu</a>) and Nikki
            Yeboah (<a href="mailto:nyeboa@uw.edu">nyeboa@uw.edu</a>).
          </p>
        </section>

        <section className="about-thanks">
          <h2>Special thanks</h2>
          <p>
            We're grateful to our sponsors at the UW School of Drama, our
            testers, and our capstone instructors André Bearfield (
            <a href="mailto:abear@uw.edu">abear@uw.edu</a>) and Alex Zhang (
            <a href="mailto:alexzzy@uw.edu">alexzzy@uw.edu</a>).
          </p>
        </section>
      </main>
    </div>
  )
}
