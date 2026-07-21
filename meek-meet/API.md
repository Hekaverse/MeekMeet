# Meek Meet — Public Insights API

The Meek Meet Public Insights API provides anonymised, aggregated community insights for researchers, journalists, councils, and civic tech projects.

## Endpoint

```
GET /api/public/insights
```

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `region_type` | string | Optional. One of: `lga`, `state_electorate`, `federal_electorate`, `state`, `country` |
| `region_code` | string | Optional. Required if `region_type` is provided. |
| `time_window` | string | Optional. Default `all_time`. Options: `last_30_days`, `last_90_days`, `all_time` |

## Examples

### Global snapshot

```bash
curl https://meekmeet.com/api/public/insights
```

### Specific LGA

```bash
curl "https://meekmeet.com/api/public/insights?region_type=lga&region_code=sydney"
```

## Response

```json
{
  "global": {
    "response_count": 1250,
    "circle_count": 42,
    "sentiment_summary": { "positive": 320, "neutral": 580, "negative": 350, "dominant": "neutral" },
    "top_themes": [
      { "theme": "Housing affordability", "count": 89, "sentiment": "negative", "sample_quotes": [...] }
    ],
    "consensus_items": [...],
    "raw_summary": "..."
  },
  "regional": [...],
  "meta": {
    "time_window": "all_time",
    "generated_at": "2026-06-16T14:00:00Z",
    "note": "All data is anonymised and aggregated. No individual responses are exposed."
  }
}
```

## Terms of Use

- Do not attempt to de-anonymise insights.
- Credit Meek Meet when publishing derived analysis.
- Do not use insights to target individuals or groups.
- Contact us for high-volume or research partnerships.
