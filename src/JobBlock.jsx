import React from 'react'

export default function JobBlock({ job, jobStyle, isExpanded, expandedJobId, toggleJob }) {
    const isConnected = expandedJobId !== null && job.connectedTo?.includes(expandedJobId)

    return (
        <>
            <div
                className={`job-block 
                    ${isConnected ? 'connected-job' : ''} 
                    ${isExpanded ? 'selected-job' : ''}`}
                style={jobStyle}
                onClick={(e) => {
                    e.stopPropagation()
                    toggleJob(job)
                }}
            >
                {job.title}
            </div>

            {isExpanded && (
                <div
                    className="job-info-box"
                    style={{
                        top: `calc(${jobStyle.top} + 2.4%)`,
                        left: `calc(${jobStyle.left})`,
                    }}
                >
                    <div>
                        <strong>{job.title}</strong>
                    </div>
                    <div>
                        {new Date(job.start).toLocaleString()} → {new Date(job.end).toLocaleString()}
                    </div>

                    {job.dependencies && job.dependencies.length > 0 && (
                        <div className="job-dependencies-container">
                            <div className="job-dependencies">
                                <div className="dep-title">Dependencies</div>
                                <ul>
                                    {job.dependencies.map((dep, idx) => (
                                        <li key={idx}>{dep}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {'partsAvailable' in job && (
                        <div className="parts-check-container">
                            <div className="parts-check">
                                <span>Parts available</span>
                                <input type="checkbox" checked={job.partsAvailable === 1} readOnly />
                            </div>
                        </div>
                    )}

                    {'criticality' in job && (
                        <div className="criticality-container">
                            <div className="criticality-label">Criticality</div>
                            <div className="criticality-boxes">
                                {[1, 2, 3, 4, 5].map((level) => {
                                    const filled = job.criticality >= level
                                    const colorClass = filled ? `crit-${level}` : ''
                                    return <div key={level} className={`criticality-box ${colorClass}`} />
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
