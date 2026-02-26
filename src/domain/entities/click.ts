export type Click = {
    shortCode: string
    ip: string
    userAgent: string
    referrer: string
    timestamp: Date
}

export type UrlStats = {
    totalClicks: number
    last24Hours: number
    topReferrers: Array<{ referrer: string; count: number }>
    recentClicks: Pick<Click, 'ip' | 'userAgent' | 'referrer' | 'timestamp'>[]
}
