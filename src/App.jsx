import { useEffect, useRef, useState } from 'react'
import './App.css'

const VANLIGA_SPRAK = [
  'Engelska',
  'Spanska',
  'Ukrainska',
  'Annat (anges nedan)',
]

// nID från \User\Group::tree(159) (hämtade från tolktid.se/bestall).
const TOLKMETODER = [
  { id: 160, value: 'Teckenspråkstolkning', label: 'Teckenspråkstolkning' },
  { id: 161, value: 'Dövblindtolkning', label: 'Dövblindtolkning' },
  { id: 162, value: 'Skrivtolkning', label: 'Skrivtolkning' },
  { id: 163, value: 'TSS-tolkning', label: 'TSS-tolkning' },
  { id: 164, value: 'Annan typ av tolkning', label: 'Relätolk/Tolkstöd (döv tolk)' },
]

const BACKEND_TO_REACT = {
  strBestallarensNamn: 'namn',
  strBestallarensMobil: 'telefon',
  strBestallarensEpost: 'epost',
  dDatum: 'datum',
  tStart: 'starttid',
  tSlut: 'sluttid',
  strAdress: 'adress',
  strOrt: 'ort',
  strPlatsInfo: 'platsinfo',
  strMotesPlattform: 'plattform',
  strMoteslank: 'moteslank',
  strMeddelande: 'innehall',
  strMeddelandeExtra: 'ovrigt',
  strTolkanvandare: 'tolkanvandare',
  strMetod: 'tolkmetod',
}

function buildPayload(form) {
  const metod = TOLKMETODER.find((m) => m.value === form.tolkmetod)

  let sprakRad = 'Annat språk än talad svenska / svenskt teckenspråk: Nej'
  if (form.annatSprak === 'ja') {
    const sprak =
      form.sprakVal && form.sprakVal !== 'Annat (anges nedan)'
        ? form.sprakVal
        : form.sprakAnnat || '(ej angivet)'
    sprakRad = `Annat språk än talad svenska / svenskt teckenspråk: Ja – ${sprak}`
  }

  const stadInfo = [
    `Inköpsordernummer: ${form.inkopsordernummer}`,
    `Förvaltning/verksamhet: ${form.forvaltning}`,
    sprakRad,
    form.bradska === '24h'
      ? 'Brådska: Uppdraget ska utföras inom 24h (position 3 "Tolkuppdrag inom 24 timmar")'
      : '',
    form.bradska === '2h'
      ? 'Brådska: Uppdraget ska utföras inom 2h (position 4 "Akuta tolkuppdrag")'
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const meddelandeBlock = [
    '[Stockholms stad – ramavtal SF 2026/378]',
    stadInfo,
    '',
    form.deltagare ? `Deltagares namn och mötets syfte:\n${form.deltagare}` : '',
    form.innehall ? `Tolkningens innehåll:\n${form.innehall}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    strID: form.inkopsordernummer,
    ss_confirmed: true,
    strTypavmote: form.motestyp === 'plats' ? 'paplats' : 'distans',
    strBestallarensNamn: form.namn,
    strBestallarensMobil: form.telefon,
    strBestallarensEpost: form.epost,
    dDatum: form.datum,
    tStart: form.starttid,
    tSlut: form.sluttid,
    strAdress: form.motestyp === 'plats' ? form.adress : '',
    strOrt: form.motestyp === 'plats' ? form.ort : '',
    strPlatsInfo: form.motestyp === 'plats' ? form.platsinfo : '',
    strMotesPlattform: form.motestyp === 'distans' ? form.plattform : '',
    strMoteslank: form.motestyp === 'distans' ? form.moteslank : '',
    strMeddelande: meddelandeBlock,
    strMeddelandeExtra: form.ovrigt,
    strMetod: metod ? metod.id : '',
    strTolkanvandare: form.tolkanvandare,
    strFakturaForetag: form.forvaltning,
    strFakturaOrg: '',
    strFakturaAdress: '',
    strFakturaPostnummer: '',
    strFakturaOrt: '',
    strFakturaInformation: `Inköpsordernummer: ${form.inkopsordernummer}`,
  }
}

const initialState = {
  inkopsordernummer: '',
  forvaltning: '',
  namn: '',
  telefon: '',
  epost: '',
  datum: '',
  starttid: '',
  sluttid: '',
  motestyp: 'plats',
  adress: '',
  ort: '',
  platsinfo: '',
  plattform: '',
  moteslank: '',
  tolkanvandare: '',
  deltagare: '',
  innehall: '',
  ovrigt: '',
  tolkmetod: TOLKMETODER[0].value,
  annatSprak: 'nej',
  sprakVal: '',
  sprakAnnat: '',
  bradska: '',
}

function isDebugMode() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return (
    params.get('debugtest') === 'true' ||
    params.get('debug') === 'true' ||
    params.get('dev') === 'true'
  )
}

function getInitialState() {
  if (!isDebugMode()) return initialState
  const today = new Date().toISOString().slice(0, 10)
  return {
    ...initialState,
    inkopsordernummer: 'PO-2026-12345',
    forvaltning: 'Socialförvaltningen, äldreomsorg',
    namn: 'Anna Andersson',
    telefon: '08-123 45 67',
    epost: 'anna.andersson@stockholm.se',
    datum: today,
    starttid: '10:00',
    sluttid: '11:00',
    adress: 'Sveavägen 1',
    ort: 'Stockholm',
    platsinfo: 'Plan 3, rum 305',
    tolkanvandare: 'Erik Eriksson',
    deltagare: 'Anna Andersson (beställare), Erik Eriksson',
    innehall: 'Genomgång av nytt ärende. Testdata via ?debugtest=true.',
    ovrigt: 'Inga särskilda önskemål.',
  }
}

const FIELD_LABELS = {
  inkopsordernummer: 'Ert inköpsordernummer',
  forvaltning: 'Förvaltning / verksamhet',
  namn: 'Namn',
  telefon: 'Telefonnummer',
  epost: 'E-post',
  datum: 'Datum',
  starttid: 'Starttid',
  sluttid: 'Sluttid',
  adress: 'Adress',
  ort: 'Ort',
  plattform: 'Plattform',
  tolkanvandare: 'Tolkanvändare',
  sprakVal: 'Språk',
  sprakAnnat: 'Annat språk',
}

function validate(form) {
  const errors = {}
  const req = (key, msg) => {
    if (!String(form[key] || '').trim()) errors[key] = msg
  }

  req('inkopsordernummer', 'Fyll i inköpsordernummer')
  req('forvaltning', 'Ange vilken förvaltning eller verksamhet du tillhör')
  req('namn', 'Ange ditt namn')

  if (!form.telefon.trim()) {
    errors.telefon = 'Ange telefonnummer'
  } else if (!/^[\d\s+()/-]{6,}$/.test(form.telefon.trim())) {
    errors.telefon = 'Ange ett giltigt telefonnummer'
  }

  if (!form.epost.trim()) {
    errors.epost = 'Ange e-post'
  } else if (!/^\S+@\S+\.\S+$/.test(form.epost.trim())) {
    errors.epost = 'Ange en giltig e-postadress'
  }

  req('datum', 'Välj datum')
  req('starttid', 'Välj starttid')
  if (!form.sluttid) {
    errors.sluttid = 'Välj sluttid'
  } else if (form.starttid && form.sluttid <= form.starttid) {
    errors.sluttid = 'Sluttid måste vara efter starttid'
  }

  if (form.motestyp === 'plats') {
    req('adress', 'Ange adress')
    req('ort', 'Ange ort')
  } else {
    req('plattform', 'Ange plattform (t.ex. Zoom eller Teams)')
  }

  req('tolkanvandare', 'Ange vem som ska använda tolken')

  if (form.annatSprak === 'ja') {
    if (!form.sprakVal) {
      errors.sprakVal = 'Välj språk'
    } else if (
      form.sprakVal === 'Annat (anges nedan)' &&
      !form.sprakAnnat.trim()
    ) {
      errors.sprakAnnat = 'Ange språk'
    }
  }

  return errors
}

export default function App() {
  const [form, setForm] = useState(getInitialState)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [skickad, setSkickad] = useState(false)
  const [serverMessage, setServerMessage] = useState('')
  const apiErrorRef = useRef(null)

  useEffect(() => {
    if (apiError && apiErrorRef.current) {
      apiErrorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [apiError])

  const clearError = (field) =>
    setErrors((errs) => {
      if (!errs[field]) return errs
      const { [field]: _, ...rest } = errs
      return rest
    })

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    clearError(field)
    if (apiError) setApiError('')
  }

  const updateTime = (field) => (e) => {
    let val = e.target.value
    if (val && /^\d{2}:\d{2}$/.test(val)) {
      const [h, m] = val.split(':').map(Number)
      const snapped = Math.round(m / 5) * 5
      if (snapped === 60) {
        const newH = (h + 1) % 24
        val = `${String(newH).padStart(2, '0')}:00`
      } else {
        val = `${String(h).padStart(2, '0')}:${String(snapped).padStart(2, '0')}`
      }
    }
    setForm((f) => ({ ...f, [field]: val }))
    clearError(field)
    if (apiError) setApiError('')
  }

  const toggleBradska = (value) => () =>
    setForm((f) => ({ ...f, bradska: f.bradska === value ? '' : value }))

  const setDuration = (hours) => () => {
    setForm((f) => {
      let start = f.starttid
      if (!start) {
        const now = new Date()
        const nextHour = (now.getHours() + 1) % 24
        start = `${String(nextHour).padStart(2, '0')}:00`
      }
      const [h, m] = start.split(':').map(Number)
      const total = h * 60 + m + hours * 60
      const endH = Math.floor(total / 60) % 24
      const endM = total % 60
      const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      return { ...f, starttid: start, sluttid: end }
    })
    clearError('starttid')
    clearError('sluttid')
  }

  const scrollToField = (key) => {
    const el = document.querySelector(`[name="${key}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el.focus(), 350)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    setApiError('')

    if (Object.keys(errs).length > 0) {
      scrollToField(Object.keys(errs)[0])
      return
    }

    const FRIENDLY_ERROR =
      'Beställningen kunde inte tas emot just nu. Vänligen försök igen om en stund. Om problemet kvarstår, kontakta oss på info@stockholmstolkarna.se.'

    setSubmitting(true)
    try {
      const payload = buildPayload(form)
      const body = new URLSearchParams()
      Object.entries(payload).forEach(([k, v]) => body.append(k, v ?? ''))

      let res
      try {
        res = await fetch('/api/v1/order/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Accept: 'application/json',
          },
          body: body.toString(),
          credentials: 'same-origin',
        })
      } catch (networkErr) {
        console.error('[Order] Network error:', networkErr)
        throw new Error(FRIENDLY_ERROR)
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase()
      const isJson = contentType.includes('application/json')

      if (!isJson) {
        const preview = await res.text().catch(() => '')
        console.error(
          `[Order] Unexpected response — HTTP ${res.status}, content-type "${contentType}". Body preview:`,
          preview.slice(0, 500)
        )
        throw new Error(FRIENDLY_ERROR)
      }

      let data = null
      try {
        data = await res.json()
      } catch (parseErr) {
        console.error('[Order] Failed to parse JSON response:', parseErr)
        throw new Error(FRIENDLY_ERROR)
      }

      if (data.bSuccess) {
        setServerMessage(data.strMessage || '')
        setSkickad(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      if (Array.isArray(data.aryMessage) && data.aryMessage.length > 0) {
        const mapped = {}
        data.aryMessage.forEach(({ strInput, strMessage }) => {
          const reactField = BACKEND_TO_REACT[strInput] || strInput
          mapped[reactField] = strMessage
        })
        setErrors(mapped)
        scrollToField(Object.keys(mapped)[0])
      }
      if (data.strMessage) setApiError(data.strMessage)
    } catch (err) {
      setApiError(err.message || 'Kunde inte nå servern. Försök igen.')
    } finally {
      setSubmitting(false)
    }
  }

  const errorCount = Object.keys(errors).length

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero__inner">
          <a href="/" className="hero__logo" aria-label="Stockholms stad">
            <img
              src="https://start.stockholm/ui/assets/img/logotype.svg"
              alt="Stockholms stad"
            />
          </a>
          <div className="partner-badge">
            <span className="partner-badge__icon-wrap" aria-hidden="true">
              <img
                className="partner-badge__icon"
                src={`${import.meta.env.BASE_URL}stab.png`}
                alt=""
              />
            </span>
            <div className="partner-badge__text">
              <span>I samarbete mellan</span>
              <strong>Stockholmstolkarna &amp; Stockholms stad</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="notice">
        <div className="container notice__inner">
          <p>
            Behörig beställare inom Stockholms stad för ramavtal med
            diarienummer <strong>SF 2026/378</strong>, lägg din beställning
            här.
          </p>
        </div>
      </div>

      <main className="container main" id="bestall">
        {skickad ? (
          <div className="kvittens" role="status">
            <h2>Tack för din beställning!</h2>
            <p>
              Du kommer strax få ett mail med en bekräftelse på att vi
              har mottagit din beställning.
            </p>
            {serverMessage && (
              <p
                className="kvittens__server"
                dangerouslySetInnerHTML={{ __html: serverMessage }}
              />
            )}
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setForm(initialState)
                setErrors({})
                setApiError('')
                setServerMessage('')
                setSkickad(false)
              }}
            >
              Gör en ny beställning
            </button>
          </div>
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
            {apiError && (
              <div
                ref={apiErrorRef}
                className="api-error"
                role="alert"
                aria-live="assertive"
              >
                <div className="api-error__icon" aria-hidden="true">!</div>
                <div className="api-error__body">
                  <strong>Beställningen kunde inte skickas</strong>
                  <p>{apiError}</p>
                </div>
                <button
                  type="button"
                  className="api-error__close"
                  aria-label="Stäng felmeddelande"
                  onClick={() => setApiError('')}
                >
                  ×
                </button>
              </div>
            )}
            {errorCount > 0 && (
              <div className="form-summary" role="alert" aria-live="polite">
                <strong>
                  {errorCount === 1
                    ? '1 fält behöver kompletteras'
                    : `${errorCount} fält behöver kompletteras`}
                </strong>
                <ul>
                  {Object.entries(errors).map(([key, msg]) => (
                    <li key={key}>
                      <button
                        type="button"
                        className="form-summary__link"
                        onClick={() => scrollToField(key)}
                      >
                        {FIELD_LABELS[key] || key}: {msg}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Section
              number="1"
              title="Stockholms stad"
              description="Uppgifter om din förvaltning och inköpsorder."
            >
              <Field
                label="Ert inköpsordernummer"
                required
                error={errors.inkopsordernummer}
              >
                <input
                  type="text"
                  name="inkopsordernummer"
                  value={form.inkopsordernummer}
                  onChange={update('inkopsordernummer')}
                  aria-invalid={!!errors.inkopsordernummer}
                />
              </Field>
              <Field
                label="Vilken förvaltning eller verksamhet inom Stockholms stad tillhör du?"
                required
                error={errors.forvaltning}
              >
                <input
                  type="text"
                  name="forvaltning"
                  value={form.forvaltning}
                  onChange={update('forvaltning')}
                  aria-invalid={!!errors.forvaltning}
                />
              </Field>
            </Section>

            <Section
              number="2"
              title="Beställaruppgifter"
              description="Vem ska vi kontakta angående bokningen?"
            >
              <Field label="Namn" required error={errors.namn}>
                <input
                  type="text"
                  name="namn"
                  value={form.namn}
                  onChange={update('namn')}
                  aria-invalid={!!errors.namn}
                />
              </Field>
              <Field label="Telefonnummer" required error={errors.telefon}>
                <input
                  type="tel"
                  name="telefon"
                  value={form.telefon}
                  onChange={update('telefon')}
                  aria-invalid={!!errors.telefon}
                />
              </Field>
              <Field label="E-post" required error={errors.epost}>
                <input
                  type="email"
                  name="epost"
                  value={form.epost}
                  onChange={update('epost')}
                  aria-invalid={!!errors.epost}
                />
              </Field>
            </Section>

            <Section
              number="3"
              title="Datum och tid"
              description="När ska tolkningen utföras?"
            >
              <Field label="Datum" required error={errors.datum}>
                <input
                  type="date"
                  name="datum"
                  value={form.datum}
                  onChange={update('datum')}
                  aria-invalid={!!errors.datum}
                />
              </Field>
              <div className="grid-2">
                <Field label="Starttid" required error={errors.starttid}>
                  <TimePicker
                    name="starttid"
                    value={form.starttid}
                    onChange={update('starttid')}
                    invalid={!!errors.starttid}
                  />
                </Field>
                <Field label="Sluttid" required error={errors.sluttid}>
                  <TimePicker
                    name="sluttid"
                    value={form.sluttid}
                    onChange={update('sluttid')}
                    invalid={!!errors.sluttid}
                  />
                </Field>
              </div>

              <div className="duration-quick" role="group" aria-label="Snabbval för längd">
                <span className="duration-quick__label">Snabbval:</span>
                <button
                  type="button"
                  className="duration-quick__btn"
                  onClick={setDuration(1)}
                >
                  1 timme
                </button>
                <button
                  type="button"
                  className="duration-quick__btn"
                  onClick={setDuration(2)}
                >
                  2 timmar
                </button>
                <button
                  type="button"
                  className="duration-quick__btn"
                  onClick={setDuration(4)}
                >
                  4 timmar
                </button>
              </div>
            </Section>

            <Section
              number="4"
              title="Typ av möte"
              description="Sker mötet på plats eller på distans?"
            >
              <div className="radio-group" role="radiogroup">
                <label className="radio">
                  <input
                    type="radio"
                    name="motestyp"
                    value="plats"
                    checked={form.motestyp === 'plats'}
                    onChange={update('motestyp')}
                  />
                  <span>På plats</span>
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="motestyp"
                    value="distans"
                    checked={form.motestyp === 'distans'}
                    onChange={update('motestyp')}
                  />
                  <span>Distans</span>
                </label>
              </div>

              {form.motestyp === 'plats' ? (
                <>
                  <Field label="Adress" required error={errors.adress}>
                    <input
                      type="text"
                      name="adress"
                      value={form.adress}
                      onChange={update('adress')}
                      aria-invalid={!!errors.adress}
                    />
                  </Field>
                  <Field label="Ort" required error={errors.ort}>
                    <input
                      type="text"
                      name="ort"
                      value={form.ort}
                      onChange={update('ort')}
                      aria-invalid={!!errors.ort}
                    />
                  </Field>
                  <Field
                    label="Information om plats"
                    hint="T.ex. portkod, våning, lokalnamn"
                  >
                    <input
                      type="text"
                      name="platsinfo"
                      value={form.platsinfo}
                      onChange={update('platsinfo')}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field
                    label="Plattform"
                    hint="Exempel: Zoom eller Teams"
                    required
                    error={errors.plattform}
                  >
                    <input
                      type="text"
                      name="plattform"
                      value={form.plattform}
                      onChange={update('plattform')}
                      aria-invalid={!!errors.plattform}
                    />
                  </Field>
                  <Field label="Möteslänk">
                    <input
                      type="url"
                      name="moteslank"
                      value={form.moteslank}
                      onChange={update('moteslank')}
                      placeholder="https://"
                    />
                  </Field>
                </>
              )}
            </Section>

            <Section
              number="5"
              title="Beskrivning"
              description="Beskriv mötets sammanhang så att tolken kan förbereda sig."
            >
              <Field
                label="Tolkanvändare"
                hint="Vem ska använda tolken?"
                required
                error={errors.tolkanvandare}
              >
                <input
                  type="text"
                  name="tolkanvandare"
                  value={form.tolkanvandare}
                  onChange={update('tolkanvandare')}
                  aria-invalid={!!errors.tolkanvandare}
                />
              </Field>
              <Field label="Deltagares namn och mötets syfte">
                <textarea
                  rows="3"
                  name="deltagare"
                  value={form.deltagare}
                  onChange={update('deltagare')}
                />
              </Field>
              <Field label="Tolkningens innehåll">
                <textarea
                  rows="3"
                  name="innehall"
                  value={form.innehall}
                  onChange={update('innehall')}
                />
              </Field>
              <Field label="Övriga upplysningar">
                <textarea
                  rows="3"
                  name="ovrigt"
                  value={form.ovrigt}
                  onChange={update('ovrigt')}
                />
              </Field>
            </Section>

            <Section
              number="6"
              title="Typ av uppdrag"
              description="Välj den tolkmetod som behövs."
            >
              <Field label="Typ av uppdrag" required>
                <select
                  name="tolkmetod"
                  value={form.tolkmetod}
                  onChange={update('tolkmetod')}
                >
                  {TOLKMETODER.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kommer uppdraget vara på något annat språk än talad svenska och svenskt teckenspråk?">
                <div className="radio-group" role="radiogroup">
                  <label className="radio">
                    <input
                      type="radio"
                      name="annatSprak"
                      value="ja"
                      checked={form.annatSprak === 'ja'}
                      onChange={update('annatSprak')}
                    />
                    <span>Ja</span>
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="annatSprak"
                      value="nej"
                      checked={form.annatSprak === 'nej'}
                      onChange={update('annatSprak')}
                    />
                    <span>Nej</span>
                  </label>
                </div>
              </Field>

              {form.annatSprak === 'ja' && (
                <>
                  <Field label="Vilket språk?" required>
                    <select
                      name="sprakVal"
                      value={form.sprakVal}
                      onChange={update('sprakVal')}
                    >
                      <option value="">Välj språk…</option>
                      {VANLIGA_SPRAK.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {form.sprakVal === 'Annat (anges nedan)' && (
                    <Field label="Ange språk" required>
                      <input
                        type="text"
                        name="sprakAnnat"
                        value={form.sprakAnnat}
                        onChange={update('sprakAnnat')}
                      />
                    </Field>
                  )}
                </>
              )}

              <div className="urgency">
                <label className="urgency__item">
                  <input
                    type="checkbox"
                    checked={form.bradska === '24h'}
                    onChange={toggleBradska('24h')}
                  />
                  <span>
                    <strong>Uppdraget ska utföras inom 24h.</strong>{' '}
                    Observera att detta medför en extra kostnad enligt
                    position 3 <em>"Tolkuppdrag inom 24 timmar"</em> i
                    ramavtalet.
                  </span>
                </label>
                <label className="urgency__item">
                  <input
                    type="checkbox"
                    checked={form.bradska === '2h'}
                    onChange={toggleBradska('2h')}
                  />
                  <span>
                    <strong>Uppdraget ska utföras inom 2h.</strong>{' '}
                    Observera att detta medför en extra kostnad enligt
                    position 4 <em>"Akuta tolkuppdrag"</em> i ramavtalet.
                  </span>
                </label>
              </div>
            </Section>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Skickar…' : 'Skicka beställning'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setForm(initialState)
                  setErrors({})
                  setApiError('')
                }}
                disabled={submitting}
              >
                Rensa formuläret
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

function Section({ number, title, description, children }) {
  return (
    <section className="form-section">
      <div className="form-section__head">
        <span className="form-section__num">{number}</span>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="form-section__body">{children}</div>
    </section>
  )
}

function TimePicker({ name, value, onChange, invalid }) {
  const valid = value && /^\d{2}:\d{2}$/.test(value)
  const h = valid ? value.split(':')[0] : ''
  const m = valid ? value.split(':')[1] : ''

  const emit = (hh, mm) => {
    if (!hh && !mm) {
      onChange({ target: { value: '' } })
      return
    }
    const hs = (hh || '00').padStart(2, '0')
    const ms = (mm || '00').padStart(2, '0')
    onChange({ target: { value: `${hs}:${ms}` } })
  }

  return (
    <div className={`time-picker${invalid ? ' time-picker--invalid' : ''}`}>
      <select
        name={name}
        value={h}
        onChange={(e) => emit(e.target.value, m)}
        aria-label="Timme"
        aria-invalid={invalid}
      >
        <option value="">--</option>
        {Array.from({ length: 24 }, (_, i) => {
          const v = String(i).padStart(2, '0')
          return (
            <option key={v} value={v}>
              {v}
            </option>
          )
        })}
      </select>
      <span className="time-picker__sep" aria-hidden="true">
        :
      </span>
      <select
        value={m}
        onChange={(e) => emit(h, e.target.value)}
        aria-label="Minut"
        aria-invalid={invalid}
      >
        <option value="">--</option>
        {Array.from({ length: 12 }, (_, i) => {
          const v = String(i * 5).padStart(2, '0')
          return (
            <option key={v} value={v}>
              {v}
            </option>
          )
        })}
      </select>
    </div>
  )
}

function Field({ label, hint, required, error, children }) {
  return (
    <label className={`field${error ? ' field--error' : ''}`}>
      <span className="field__label">
        {label}
        {required && <span className="field__req" aria-hidden="true"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </label>
  )
}
