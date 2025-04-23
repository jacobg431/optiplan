import React, { useState, useEffect } from 'react'
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

                    let criticality = 1
                    let partsAvailable = 0
                    let connectedTo = []
                    const excludedDependencyNames = ['Other work orders', 'Calculatory Costs']
                    let dependencyMap = {}
                    let dependencyFlags = []

                    wotdForWO.forEach((depInstance) => {
                        const depInfo = dependencies.find((d) => d.id === depInstance.dependencyId)
                        if (!depInfo) return

                        // Criticality (ID 9)
                        if (depInfo.id === 9 && typeof depInstance.integerAttributeValue === 'number') {
                            criticality = depInstance.integerAttributeValue
                        }

                        // Parts Available (ID 6)
                        if (depInfo.id === 6 && depInstance.booleanAttributeValue === 1) {
                            partsAvailable = 1
                        }

                        // Connected Jobs (ID 1)
                        if (depInfo.id === 1 && typeof depInstance.integerAttributeValue === 'number') {
                            connectedTo.push(depInstance.integerAttributeValue)
                        }

                        // Skip special logic dependencies
                        if ([1, 6, 9].includes(depInfo.id) || excludedDependencyNames.includes(depInfo.name)) return

                        const labelValue =
                            depInstance.textAttributeValue ??
                            depInstance.integerAttributeValue ??
                            depInstance.numberAttributeValue ??
                            (typeof depInstance.booleanAttributeValue === 'number'
                                ? depInstance.booleanAttributeValue
                                    ? 'Yes'
                                    : 'No'
                                : '')

                        if (labelValue !== '') {
                            if (!dependencyMap[depInfo.name]) {
                                dependencyMap[depInfo.name] = []
                            }
                            dependencyMap[depInfo.name].push(labelValue)

                            // Push to dependencyFlags for logic-only use (e.g., "W30", "U30")
                            dependencyFlags.push(labelValue)
                        }
                    })

                    const dependencyNames = Object.entries(dependencyMap).map(
                        ([name, values]) => `${name}: ${values.join(', ')}`,
                    )

                    return {
                        id: wo.id,
                        title: wo.name,
                        start: wo.startDateTime,
                        end: wo.stopDateTime,
                        dependencies: dependencyNames, // For display
                        dependencyFlags, // For logic (e.g., .includes("W30"))
                        connectedTo,
                        partsAvailable,
                        criticality,
                    }
                })

                setJobData(jobs)
                setJobData(jobs)
                setOriginalJobs(jobs) // save the original set
                setWorkOrderToDependencies(wotds) // store full WOTDs to send to backend
            } catch (error) {
                console.error('Failed to fetch job data:', error)
            }
        }
        fetchJobs()
    }, [])

    const [showZone1] = useState(() => {
        const stored = localStorage.getItem('zone1Visible')
        return stored ? JSON.parse(stored) : true
    })

    const [expandedJobId, setExpandedJobId] = useState(null)
    const [showSearchBar, setShowSearchBar] = useState(false)
    const [searchValue, setSearchValue] = useState('')

    const [showHighlightW30, setShowHighlightW30] = useState(false)
    const [showHighlightU30, setShowHighlightU30] = useState(false)
    const [showHighlightP70, setShowHighlightP70] = useState(false)

    const [originalJobs, setOriginalJobs] = useState([])
    const [workOrderToDependencies, setWorkOrderToDependencies] = useState([])

    const [optimizeMode, setOptimizeMode] = useState(() => {
        const stored = localStorage.getItem('optimizeMode')
        return stored ? JSON.parse(stored) : false
    })

    useEffect(() => {
        localStorage.setItem('optimizeMode', JSON.stringify(optimizeMode))
    }, [optimizeMode])

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

    const toBlockIndexFromDate = (isoString) => {
        const date = new Date(isoString)
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // Monday = 0

        const hours = date.getHours()
        const minutes = date.getMinutes()
        const timeDecimal = hours + minutes / 60

        return dayIndex * 24 + timeDecimal
    }

    const handleOptimizeConfirm = async () => {
        try {
            const response = await fetch('https://localhost:5051/api/Optimization/parts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'text/plain',
                },
                body: JSON.stringify(workOrderToDependencies),
            })

            const updatedWorkOrders = await response.json()

            const updatedJobs = originalJobs.map((job) => {
                const updated = updatedWorkOrders.find((u) => u.id === job.id)
                return updated ? { ...job, start: updated.startDateTime, end: updated.stopDateTime } : job
            })

            setJobData(updatedJobs)
        } catch (error) {
            console.error('Failed to optimize schedule:', error)
        }
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
        const jobStart = new Date(job.start)
        const jobEnd = new Date(job.end)

        const { startOfWeek, endOfWeek } = getCurrentWeekRange()

        const clippedStart = jobStart < startOfWeek ? startOfWeek : jobStart
        const clippedEnd = jobEnd > endOfWeek ? endOfWeek : jobEnd

        const totalMinutesInWeek = 7 * 24 * 60
        const startMinutes = (clippedStart - startOfWeek) / 60000
        const endMinutes = (clippedEnd - startOfWeek) / 60000

        const leftPercent = (startMinutes / totalMinutesInWeek) * 100
        const widthPercent = ((endMinutes - startMinutes) / totalMinutesInWeek) * 100

        const ROW_HEIGHT = 2.3
        const top = job.row * ROW_HEIGHT

        return {
            position: 'absolute',
            top: `${top}%`,
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
        }
    }

    const getNowMarkerStyle = () => {
        const now = new Date()
        const { startOfWeek, endOfWeek } = getCurrentWeekRange()

        if (now < startOfWeek || now >= endOfWeek) return null // outside this week's scope

        const totalMinutesInWeek = 7 * 24 * 60
        const minutesSinceStart = (now - startOfWeek) / 60000

        const leftPercent = (minutesSinceStart / totalMinutesInWeek) * 100

        return {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${leftPercent}%`,
            width: '1px',
            backgroundColor: 'rgba(44, 120, 0, 0.3)',
            zIndex: 100,
            pointerEvents: 'none',
        }
    }

    const getCurrentWeekRange = () => {
        const now = new Date()
        const day = now.getDay()
        const mondayOffset = day === 0 ? -6 : 1 - day
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() + mondayOffset)
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        endOfWeek.setHours(0, 0, 0, 0)

        return { startOfWeek, endOfWeek }
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

                {!optimizeMode ? (
                    <button className="reschedule-button" onClick={() => setOptimizeMode(true)}>
                        RESCHEDULE
                    </button>
                ) : (
                    <div className="reschedule-split-button">
                        <div className="reschedule-half confirm" onClick={() => console.log('Confirm clicked')}>
                            CONFIRM
                        </div>
                        <div
                            className="reschedule-half cancel"
                            onClick={() => {
                                setJobData(originalJobs)
                                setOptimizeMode(false)
                            }}
                        >
                            CANCEL
                        </div>
                    </div>
                )}

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

                            {zone.id === 'zone1' && optimizeMode && (
                                <>
                                    <div className="zone-banner">
                                        <span className="zone-banner-title">OPTIMIZATION</span>
                                        {optimizeMode && (
                                            <span className="zone-close-button" onClick={() => setOptimizeMode(false)}>
                                                ×
                                            </span>
                                        )}
                                    </div>

                                    <div className="optimize-button" onClick={handleOptimizeConfirm}>
                                        OPTIMIZE
                                    </div>
                                    <div className="zone1-row">
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
                                    {(() => {
                                        const { startOfWeek, endOfWeek } = getCurrentWeekRange()
                                        const visibleJobs = jobData.filter((job) => {
                                            const start = new Date(job.start)
                                            const end = new Date(job.end)
                                            return end >= startOfWeek && start <= endOfWeek
                                        })

                                        return visibleJobs.map((job) => {
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
                                                        const hasW30 = clickedJob.dependencyFlags?.includes('W30')
                                                        const hasU30 = clickedJob.dependencyFlags?.includes('U30')
                                                        const hasP70 = clickedJob.dependencyFlags?.includes('P70')

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
                                        })
                                    })()}
                                </div>
                            )}

                            {zone.id === 'zone4' && (
                                <div className="now-line-wrapper">
                                    {getNowMarkerStyle() && <div style={getNowMarkerStyle()} />}
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
