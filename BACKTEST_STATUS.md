# Swing backtest — run status

## TL;DR
The backtest **could not be run in the Claude Code web environment** because the
network egress policy blocks every market-data provider. No results have been
produced. **No numbers below because there are none — I will not fabricate
backtest results for a real-money decision.**

## What was done
- Reconstructed `swing_backtest.py` from the source PDF (it was not in the repo).
- Installed `yfinance`, `pandas`, `numpy`.
- Verified the script compiles and the strategy logic + trade engine run
  end-to-end on **synthetic** data (smoke test only — meaningless numbers).

## The blocker
`yfinance` (and every alternative) needs an outbound HTTPS host that this
session's egress policy denies with `403 CONNECT tunnel failed`:

| Host | Result |
|------|--------|
| query1/query2.finance.yahoo.com, fc.yahoo.com | 403 blocked |
| stooq.com | 403 blocked |
| alphavantage, tiingo, nasdaq, polygon, iex, fmp, twelvedata, marketstack, eodhd | 403 blocked |
| github.com / raw.githubusercontent.com / pypi.org | reachable |

Per the agent-proxy README, org-policy `403`s must be reported, not bypassed.

## How to get real results (pick one)
1. **Allow a data host in the environment's network policy** (e.g. the Yahoo
   Finance hosts above), then re-run this session — I'll run it and judge it.
   Docs: https://code.claude.com/docs/en/claude-code-on-the-web
2. **Run it locally yourself** and paste the full console output back here; I'll
   apply the pass/fail rubric honestly:
   ```
   pip install yfinance pandas numpy
   python swing_backtest.py
   ```
3. Point me at a data source that IS reachable from this session.

## The pass/fail rubric that will be applied (unchanged)
A strategy "wins" only if ALL hold:
- Expectancy ≥ +0.15R/trade **after** subtracting 0.1R slippage/fees
- Profit factor ≥ 1.3
- Positive total R in ≥ 4 of the last 6 years
- ≥ 100 total trades

If neither passes, the answer is "neither passes." No parameter tuning until
something passes (that is curve fitting). At most 2–3 pre-declared variations
may be tested, and ALL variations — winners and losers — will be reported.
