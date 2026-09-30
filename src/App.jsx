import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim() || ''
const TODAY_LABEL = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

function formatTime(timestamp, timezoneOffset) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date((timestamp + timezoneOffset) * 1000))
}

function App() {
  const [cityInput, setCityInput] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchWeather = useCallback(async (city) => {
    if (!API_KEY) {
      setError('Set VITE_OPENWEATHER_API_KEY in your local .env file to load weather.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(API_KEY)}&units=metric`,
      )
      let data
      try {
        data = await response.json()
      } catch {
        throw new Error('The weather service returned an unreadable response. Please try again.')
      }

      if (!response.ok) {
        if (response.status === 401) throw new Error('That API key is not valid yet. Check it and try again.')
        if (response.status === 404) throw new Error(`We couldn’t find “${city}”. Check the spelling and try again.`)
        if (response.status === 429) throw new Error('The weather service is receiving too many requests. Please try again shortly.')
        throw new Error(data.message || 'Weather data is unavailable right now. Please try again.')
      }

      if (
        !data?.name ||
        !Array.isArray(data.weather) ||
        !data.weather[0]?.description ||
        !data.weather[0]?.icon ||
        !Number.isFinite(data.main?.temp) ||
        !Number.isFinite(data.main?.humidity) ||
        !Number.isFinite(data.main?.feels_like) ||
        !Number.isFinite(data.wind?.speed) ||
        !Number.isFinite(data.sys?.sunrise) ||
        !Number.isFinite(data.sys?.sunset) ||
        !Number.isFinite(data.timezone) ||
        !Number.isFinite(data.coord?.lat) ||
        !Number.isFinite(data.coord?.lon)
      ) {
        throw new Error('The weather service returned incomplete data. Please try again.')
      }

      setWeather(data)
      setCityInput('')
    } catch (fetchError) {
      setError(fetchError instanceof TypeError
        ? 'Could not reach the weather service. Check your connection and try again.'
        : fetchError.message || 'Weather data is unavailable right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const request = window.setTimeout(() => fetchWeather('London'), 0)
    return () => window.clearTimeout(request)
  }, [fetchWeather])

  function searchCity(event) {
    event.preventDefault()
    const city = cityInput.trim()
    if (city) fetchWeather(city)
  }

  const localTime = weather
    ? new Intl.DateTimeFormat('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date((weather.dt + weather.timezone) * 1000))
    : TODAY_LABEL

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Atmos home">
          <span className="brand-mark" aria-hidden="true">a.</span>
          <span>atmos<span className="brand-period">.</span></span>
        </a>
        <span className="edition">YOUR DAILY WEATHER, AT A GLANCE</span>
        <div className="live-status"><span className="status-dot" /> LIVE CONDITIONS</div>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="eyebrow">A LITTLE LOOK OUTSIDE</p>
          <h1>Weather, <span>where you are.</span></h1>
          <p className="intro-date">{localTime}</p>
        </div>
        <form className="search-form" onSubmit={searchCity}>
          <label className="sr-only" htmlFor="city-search">Search by city</label>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            id="city-search"
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
            placeholder="Search a city..."
            autoComplete="off"
          />
          <button type="submit" aria-label="Search city" disabled={loading || !cityInput.trim()}>
            <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>

      {error && <p className="error-message" role="alert">{error}</p>}

      {loading ? (
        <section className="loading-state" aria-live="polite">
          <span className="spinner" />
          <p>Looking up the sky...</p>
        </section>
      ) : weather ? (
        <>
          <section className="weather-hero" aria-label={`Current weather in ${weather.name}`}>
            <div className="hero-copy">
              <p className="eyebrow">RIGHT NOW IN</p>
              <h2>{weather.name}{weather.sys.country && <span>{weather.sys.country}</span>}</h2>
              <p className="condition">{weather.weather[0].description}</p>
              <div className="temperature">{Math.round(weather.main.temp)}<span>°</span></div>
              <p className="feels-like">Feels like {Math.round(weather.main.feels_like)}°C</p>
            </div>
            <div className="hero-art">
              <span className="weather-orbit orbit-one" />
              <span className="weather-orbit orbit-two" />
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt={weather.weather[0].description}
              />
              <span className="sun-label">THE SKY, RIGHT NOW</span>
            </div>
            <div className="hero-footnote"><span>⌖</span> {weather.coord.lat.toFixed(2)}° N&nbsp; / &nbsp;{Math.abs(weather.coord.lon).toFixed(2)}° {weather.coord.lon < 0 ? 'W' : 'E'}</div>
          </section>

          <section className="conditions-section">
            <div className="section-heading">
              <div><p className="eyebrow">THE DETAILS</p><h2>Today’s conditions</h2></div>
              <span className="updated-label">LIVE FROM OPENWEATHERMAP</span>
            </div>
            <div className="conditions-grid">
              <article className="condition-item">
                <span className="detail-icon humidity-icon" aria-hidden="true">◌</span>
                <div><p className="detail-label">HUMIDITY</p><p className="detail-value">{weather.main.humidity}<span>%</span></p><p className="detail-caption">Air moisture</p></div>
              </article>
              <article className="condition-item">
                <span className="detail-icon wind-icon" aria-hidden="true">↗</span>
                <div><p className="detail-label">WIND SPEED</p><p className="detail-value">{weather.wind.speed}<span> m/s</span></p><p className="detail-caption">{weather.wind.deg != null ? `${weather.wind.deg}° direction` : 'At ground level'}</p></div>
              </article>
              <article className="condition-item">
                <span className="detail-icon sun-icon" aria-hidden="true">↗</span>
                <div><p className="detail-label">SUNRISE</p><p className="detail-value time-value">{formatTime(weather.sys.sunrise, weather.timezone)}</p><p className="detail-caption">A new day begins</p></div>
              </article>
              <article className="condition-item">
                <span className="detail-icon sunset-icon" aria-hidden="true">↘</span>
                <div><p className="detail-label">SUNSET</p><p className="detail-value time-value">{formatTime(weather.sys.sunset, weather.timezone)}</p><p className="detail-caption">Daylight fades</p></div>
              </article>
            </div>
          </section>
        </>
      ) : (
        <section className="empty-state">
          <div className="empty-sun" aria-hidden="true">☼</div>
          <p className="eyebrow">YOUR WINDOW TO THE WORLD</p>
          <h2>Let’s see what’s<br />happening outside.</h2>
          <p>Search for a city to see its current conditions. Configure your OpenWeatherMap key in the local .env file.</p>
        </section>
      )}

      <footer className="footer"><span>ATMOS WEATHER</span><span>MADE FOR LOOKING UP</span></footer>
    </main>
  )
}

export default App
