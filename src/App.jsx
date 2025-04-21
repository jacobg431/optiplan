import React, { useState, useEffect } from 'react'
// import { jobData } from '../public/job_data'
import './styling/App.css'
import JobBlock from './JobBlock'

const allowedZones = [
    {
        id: 'zone1',
        top: '74%',
        left: '0%',
        width: '32.89%',
        height: '26%',
        toggleable: true,
    },
    {
        id: 'zone2',
        top: '17%',
        left: '33.03%',
        width: '66.97%',
        height: '83%',
        toggleable: false,
    },
    {
        id: 'zone3',
        top: '12%',
        left: '33.03%',
        width: '66.97%',
        height: '5%',
        toggleable: false,
    },
    {
        id: 'zone4',
        top: '12%',
        left: '33.03%',
        width: '66.97%',
        height: '88%',
        toggleable: false,
    },
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const hoursPerDay = 8
const totalBlocks = days.length * hoursPerDay // now 7 * 8 = 56

function App() {
    const [jobData, setJobData] = useState([])

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const [workOrdersRes, dependenciesRes, wotdRes] = await Promise.all([
                    fetch('https://localhost:5051/api/WorkOrders'),
                    fetch('https://localhost:5051/api/Dependencies'),
                    fetch('https://localhost:5051/api/WorkOrdersToDependencies'),
                ])

                const [workOrders, dependencies, wotds] = await Promise.all([
                    workOrdersRes.json(),
                    dependenciesRes.json(),
                    wotdRes.json(),
                ])

                const jobs = workOrders.map((wo) => {
                    const wotdForWO = wotds.filter((d) => d.workOrderId === wo.id)

                    let dependencyNames = []
                    let criticality = 1
                    let partsAvailable = 0

                    wotdForWO.forEach((depInstance) => {
                        const depInfo = dependencies.find((d) => d.id === depInstance.dependencyId)
                        if (!depInfo) return

                        // 🎯 Add to display list only if there's actual data assigned
                        const hasMeaningfulValue =
                            depInstance.textAttributeValue !== null ||
                            depInstance.integerAttributeValue !== null ||
                            depInstance.numberAttributeValue !== null ||
                            depInstance.booleanAttributeValue !== null

                        if (depInfo.id === 9 && typeof depInstance.integerAttributeValue === 'number') {
                            criticality = depInstance.integerAttributeValue
                        }

                        if (depInfo.id === 6 && depInstance.booleanAttributeValue === 1) {
                            partsAvailable = 1
                        }

                        // Avoid showing ID 6 or 9 in the display list — they're handled separately
                        const isDisplayed = hasMeaningfulValue && depInfo.id !== 6 && depInfo.id !== 9

                        const excludedDependencyNames = ['Other work orders', 'Calculatory Costs']

                        if (isDisplayed && !excludedDependencyNames.includes(depInfo.name)) {
                            const label = depInstance.textAttributeValue
                                ? `${depInfo.name}: ${depInstance.textAttributeValue}`
                                : depInfo.name

                            dependencyNames.push(label)
                        }
                    })

                    return {
                        id: wo.id,
                        title: wo.name,
                        start: wo.startDateTime,
                        end: wo.stopDateTime,
                        dependencies: dependencyNames,
                        connectedTo: [],
                        partsAvailable,
                        criticality,
                    }
                })

                setJobData(jobs)
            } catch (error) {
                console.error('Failed to fetch job data:', error)
            }
        }

        fetchJobs()
    }, [])

    const [showZone1, setShowZone1] = useState(() => {
        const stored = localStorage.getItem('zone1Visible')
        return stored ? JSON.parse(stored) : true
    })

    const [expandedJobId, setExpandedJobId] = useState(null)
    const [showSearchBar, setShowSearchBar] = useState(false)
    const [searchValue, setSearchValue] = useState('')

    const [showHighlightW30, setShowHighlightW30] = useState(false)
    const [showHighlightU30, setShowHighlightU30] = useState(false)
    const [showHighlightP70, setShowHighlightP70] = useState(false)

    const [selectedParameter, setSelectedParameter] = useState('')
    const [parameterList, setParameterList] = useState(() => {
        const stored = localStorage.getItem('zone1ParameterList')
        return stored ? JSON.parse(stored) : []
    })

    const [zone1Options, setZone1Options] = useState(() => {
        const stored = localStorage.getItem('zone1Options')
        return stored ? JSON.parse(stored) : { optionA: false, optionB: false, optionC: false }
    })

    const [selectedJobs, setSelectedJobs] = useState(() => {
        const stored = localStorage.getItem('zone1SelectedJobs')
        return stored ? JSON.parse(stored) : []
    })

    useEffect(() => {
        localStorage.setItem('zone1Visible', JSON.stringify(showZone1))
    }, [showZone1])

    useEffect(() => {
        localStorage.setItem('zone1SelectedJobs', JSON.stringify(selectedJobs))
    }, [selectedJobs])

    useEffect(() => {
        localStorage.setItem('zone1Options', JSON.stringify(zone1Options))
    }, [zone1Options])

    useEffect(() => {
        localStorage.setItem('zone1ParameterList', JSON.stringify(parameterList))
    }, [parameterList])

    useEffect(() => {
        const handleMouseDown = (e) => {
            const clickedInsideJob = e.target.closest('.job-block') || e.target.closest('.job-info-box')

            if (!clickedInsideJob) {
                setExpandedJobId(null)
                setShowHighlightW30(false)
                setShowHighlightU30(false)
                setShowHighlightP70(false)
            }
        }

        document.addEventListener('mousedown', handleMouseDown)
        return () => {
            document.removeEventListener('mousedown', handleMouseDown)
        }
    }, [])

    const toggleZone1Option = (key) => {
        setZone1Options((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const handleToggle = () => {
        setShowZone1((prev) => !prev)
    }

    const toBlockIndexFromDate = (isoString) => {
        const date = new Date(isoString)
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // Monday = 0, Sunday = 6
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const timeDecimal = hours - 8 + minutes / 60
        return dayIndex * hoursPerDay + timeDecimal
    }

    const jobRows = []
    jobData.forEach((job) => {
        const jobStart = toBlockIndexFromDate(job.startDay, job.startTime)
        const jobEnd = toBlockIndexFromDate(job.endDay, job.endTime)
        let placed = false

        for (let row = 0; row < jobRows.length; row++) {
            const rowJobs = jobRows[row]
            const overlaps = rowJobs.some((existingJob) => {
                const start = toBlockIndexFromDate(existingJob.startDay, existingJob.startTime)
                const end = toBlockIndexFromDate(existingJob.endDay, existingJob.endTime)
                return !(jobEnd <= start - 0.0001 || jobStart >= end + 0.0001)
            })
            if (!overlaps) {
                job.row = row
                rowJobs.push(job)
                placed = true
                break
            }
        }

        if (!placed) {
            job.row = jobRows.length
            jobRows.push([job])
        }
    })

    const getJobStyle = (job) => {
        const startBlock = toBlockIndexFromDate(job.start)
        const endBlock = toBlockIndexFromDate(job.end)
        const totalWidth = 100
        const left = (startBlock / totalBlocks) * totalWidth
        const width = ((endBlock - startBlock) / totalBlocks) * totalWidth
        const ROW_HEIGHT = 2.3
        const top = job.row * ROW_HEIGHT

        return {
            position: 'absolute',
            top: `${top}%`,
            left: `${left}%`,
            width: `${width}%`,
        }
    }

    const getNowMarkerStyle = () => {
        const now = new Date()
        const dayIndex = now.getDay() // 1 = Monday, ..., 5 = Friday

        if (dayIndex < 1 || dayIndex > 5) return null

        const hours = now.getHours()
        const minutes = now.getMinutes()
        const timeDecimal = hours - 8 + minutes / 60

        if (timeDecimal < 0 || timeDecimal > 8) return null

        const blockIndex = (dayIndex - 1) * hoursPerDay + timeDecimal
        const left = (blockIndex / totalBlocks) * 100

        return {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${left}%`,
            width: '1px',
            backgroundColor: 'rgba(44, 120, 0, 0.3)',
            zIndex: 100,
        }
    }

    const getCurrentWeekDates = () => {
        const now = new Date()
        const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, ...
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
        const monday = new Date(now)
        monday.setDate(now.getDate() + mondayOffset)

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday)
            date.setDate(monday.getDate() + i)
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
            })
        })
    }

    const removeSelectedJob = (idToRemove) => {
        setSelectedJobs((prev) => prev.filter((job) => job.id !== idToRemove))
    }

    const bestMatch = searchValue
        ? jobData
              .filter((job) => job.title.toLowerCase().includes(searchValue.toLowerCase()))
              .sort(
                  (a, b) =>
                      a.title.toLowerCase().indexOf(searchValue.toLowerCase()) -
                      b.title.toLowerCase().indexOf(searchValue.toLowerCase()),
              )[0]
        : null

    return (
        <div className="background-wrapper">
            <div className="responsive-background">
                {showHighlightW30 && <div className="static-highlight-box highlight-w30"></div>}
                {showHighlightU30 && <div className="static-highlight-box highlight-u30"></div>}
                {showHighlightP70 && <div className="static-highlight-box highlight-p70"></div>}

                <button className="reschedule-button" onClick={handleToggle}>
                    RESCHEDULE
                </button>

                {allowedZones.map((zone) => {
                    if (zone.toggleable && !showZone1) return null

                    return (
                        <div
                            key={zone.id}
                            className="overlay-zone"
                            style={{
                                top: zone.top,
                                left: zone.left,
                                width: zone.width,
                                height: zone.height,
                            }}
                        >
                            {zone.id === 'zone3' && (
                                <div className="timeline-days">
                                    {days.map((day, index) => (
                                        <div key={day} className="day-column">
                                            <div className="day-label">{day}</div>
                                            <div className="day-date">{getCurrentWeekDates()[index]}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {zone.id === 'zone1' && (
                                <>
                                    <div className="zone-banner">
                                        <span className="zone-banner-title">OPTIMIZATION</span>
                                    </div>
                                    <div className="optimize-button">OPTIMIZE</div>
                                    <div className="zone1-row">
                                        {/* Left block: Prioritation */}
                                        <div>
                                            <div className="zone1-prioritation">
                                                <div className="zone1-label">PRIORITATION</div>
                                                <div className="zone1-option">
                                                    <span>COST</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={zone1Options.optionA}
                                                        onChange={() => toggleZone1Option('optionA')}
                                                    />
                                                </div>
                                                <div className="zone1-option">
                                                    <span>TIME</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={zone1Options.optionB}
                                                        onChange={() => toggleZone1Option('optionB')}
                                                    />
                                                </div>
                                                <div className="zone1-option">
                                                    <span>WORKLOAD</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={zone1Options.optionC}
                                                        onChange={() => toggleZone1Option('optionC')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right block: Empty elevated box */}
                                        <div className="zone1-urgent-jobs">
                                            <div className="zone1-label">URGENT</div>
                                            {showSearchBar && (
                                                <input
                                                    type="text"
                                                    className="zone1-search-bar"
                                                    placeholder="Search jobs..."
                                                    value={searchValue}
                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                />
                                            )}
                                            {showSearchBar && bestMatch && (
                                                <div
                                                    className="search-suggestion"
                                                    onClick={() => {
                                                        setSelectedJobs((prev) => [...prev, bestMatch])
                                                        setSearchValue('')
                                                        setShowSearchBar(false)
                                                    }}
                                                >
                                                    {bestMatch.title}
                                                </div>
                                            )}
                                            {selectedJobs.length > 0 && (
                                                <div className="selected-jobs-list">
                                                    {selectedJobs.map((job) => (
                                                        <div className="selected-job-title">
                                                            <span>{job.title}</span>
                                                            <span
                                                                className="remove-job"
                                                                onClick={() => removeSelectedJob(job.id)}
                                                            >
                                                                ×
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                className="zone1-add-button"
                                                onClick={() => setShowSearchBar((prev) => !prev)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="zone1-parameters">
                                            <div className="zone1-label">PARAMETERS</div>
                                            <div className="parameter-dropdown">
                                                <div className="parameter-dropdown-row">
                                                    <select
                                                        id="param-select"
                                                        className="dropdown-select"
                                                        value={selectedParameter}
                                                        onChange={(e) => setSelectedParameter(e.target.value)}
                                                    >
                                                        <option value="">Choose a parameter</option>
                                                        <option value="Temperature">Temperature</option>
                                                        <option value="Pressure">Pressure</option>
                                                        <option value="Vibration">Vibration</option>
                                                    </select>

                                                    <button
                                                        className="parameter-add-button"
                                                        onClick={() => {
                                                            if (
                                                                selectedParameter &&
                                                                !parameterList.includes(selectedParameter)
                                                            ) {
                                                                setParameterList((prev) => [...prev, selectedParameter])
                                                            }
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {parameterList.length > 0 && (
                                                    <div className="selected-jobs-list">
                                                        {parameterList.map((param, index) => (
                                                            <div
                                                                key={index}
                                                                className="selected-job-title parameter-style"
                                                            >
                                                                <span>{param}</span>
                                                                <span
                                                                    className="remove-job"
                                                                    onClick={() =>
                                                                        setParameterList((prev) =>
                                                                            prev.filter((p) => p !== param),
                                                                        )
                                                                    }
                                                                >
                                                                    ×
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {zone.id === 'zone2' && (
                                <div className="timeline-wrapper">
                                    {jobData.map((job) => {
                                        const jobStyle = getJobStyle(job)
                                        const isExpanded = expandedJobId === job.id

                                        return (
                                            <JobBlock
                                                key={job.id}
                                                job={job}
                                                jobStyle={jobStyle}
                                                isExpanded={isExpanded}
                                                expandedJobId={expandedJobId}
                                                toggleJob={(clickedJob) => {
                                                    const isSameJob = expandedJobId === clickedJob.id
                                                    const hasW30 = clickedJob.dependencies.includes('W30')
                                                    const hasU30 = clickedJob.dependencies.includes('U30')
                                                    const hasP70 = clickedJob.dependencies.includes('P70')

                                                    if (isSameJob) {
                                                        setExpandedJobId(null)
                                                        if (hasW30) setShowHighlightW30(false)
                                                        if (hasU30) setShowHighlightU30(false)
                                                        if (hasP70) setShowHighlightP70(false)
                                                    } else {
                                                        setExpandedJobId(clickedJob.id)
                                                        setShowHighlightW30(hasW30)
                                                        setShowHighlightU30(hasU30)
                                                        setShowHighlightP70(hasP70)
                                                    }
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            )}

                            {zone.id === 'zone4' && (
                                <div className="now-line-wrapper">
                                    <div style={getNowMarkerStyle()} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default App
