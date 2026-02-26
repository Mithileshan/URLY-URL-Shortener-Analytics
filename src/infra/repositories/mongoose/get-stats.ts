import { connect } from 'mongoose';
import { UrlStats } from '../../../domain/entities/click';
import { Credentials } from '../../../presentation/helpers/credentials';
import { ShortenerSchema } from './schemas/shortener';
import { ClickModel } from './schemas/click';

export class MongooseGetStatsRepository {
    async getStats(shortCode: string): Promise<UrlStats | null> {
        const db = await connect(Credentials.DatabaseURI);

        const short_url = `${Credentials.PrefixUrl}${shortCode}`;
        const shortener = await ShortenerSchema.findOne({ short_url }).exec();

        if (!shortener) {
            db.disconnect();
            return null;
        }

        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [totalClicks, last24Hours, topReferrers, recentClicks] = await Promise.all([
            ClickModel.countDocuments({ shortCode }),
            ClickModel.countDocuments({ shortCode, timestamp: { $gte: since24h } }),
            ClickModel.aggregate([
                { $match: { shortCode } },
                { $group: { _id: '$referrer', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $project: { referrer: '$_id', count: 1, _id: 0 } },
            ]),
            ClickModel.find({ shortCode })
                .sort({ timestamp: -1 })
                .limit(10)
                .select('ip userAgent referrer timestamp -_id')
                .exec(),
        ]);

        db.disconnect();

        return {
            totalClicks,
            last24Hours,
            topReferrers,
            recentClicks: recentClicks.map(c => ({
                ip:        c.ip,
                userAgent: c.userAgent,
                referrer:  c.referrer,
                timestamp: c.timestamp,
            })),
        };
    }
}
