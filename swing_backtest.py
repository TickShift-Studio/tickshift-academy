"""
Head-to-head swing strategy backtest: ICT-style vs Classical S/R flag continuation.
Long-only, daily bars, liquid large/mid caps (micro caps filtered out).
Run:  pip install yfinance pandas numpy
      python swing_backtest.py
All results are in R-multiples (risk units), so position sizing is separate.
This is research, not financial advice. Past results do not guarantee future results.
"""
import numpy as np
import pandas as pd
import yfinance as yf
# ----------------------------- CONFIG ---------------------------------------
UNIVERSE = [
    # Big tech / large cap
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "NFLX",
    "AVGO", "CRM", "ORCL", "ADBE", "QCOM", "INTC", "MU", "SMCI", "PLTR",
    # Other volatile large/mid caps
    "SHOP", "SQ", "COIN", "UBER", "ABNB", "SNOW", "DKNG", "RBLX", "MARA",
    "RIOT", "SOFI", "HOOD", "AFRM", "CVNA", "ROKU", "ENPH", "CELH", "TTD",
    "XOM", "CVX", "OXY", "BA", "CAT", "GS", "JPM", "DIS", "NKE", "LULU",
]
START = "2020-01-01"
MIN_PRICE = 10.0            # no micro caps / penny stocks
MIN_DOLLAR_VOL = 50e6       # avg daily dollar volume floor
ATR_LEN = 14
TIME_STOP = 15              # max bars in a trade
TARGET_R = 2.0              # fixed 2R profit target for both strategies
# ----------------------------- HELPERS --------------------------------------
def atr(df, n=ATR_LEN):
    hl = df["High"] - df["Low"]
    hc = (df["High"] - df["Close"].shift()).abs()
    lc = (df["Low"] - df["Close"].shift()).abs()
    return pd.concat([hl, hc, lc], axis=1).max(axis=1).rolling(n).mean()
def load(ticker):
    df = yf.download(ticker, start=START, auto_adjust=True, progress=False)
    if df.empty or len(df) < 250:
        return None
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df["ATR"] = atr(df)
    df["DollarVol"] = (df["Close"] * df["Volume"]).rolling(20).mean()
    return df
def liquid(df, i):
    return (df["Close"].iloc[i] >= MIN_PRICE
            and df["DollarVol"].iloc[i] >= MIN_DOLLAR_VOL)
# ----------------------------- STRATEGY A: ICT ------------------------------
# Daily-timeframe translation of the ICT swing model:
#   1. Sweep: today's low takes out the prior 15-day low (liquidity grab)
#   2. Reclaim + displacement: close back above the swept low, bullish candle
#      with range > 1.2x ATR (displacement leg)
#   3. Entry next open, stop under the sweep low, 2R target
def signals_ict(df):
    out = []
    for i in range(60, len(df) - 1):
        if not liquid(df, i):
            continue
        prior_low = df["Low"].iloc[i - 15:i].min()
        row = df.iloc[i]
        swept = row["Low"] < prior_low
        reclaimed = row["Close"] > prior_low
        displaced = (row["Close"] > row["Open"]
                     and (row["High"] - row["Low"]) > 1.2 * row["ATR"])
        if swept and reclaimed and displaced:
            stop = row["Low"] - 0.25 * row["ATR"]
            out.append((i + 1, stop))  # enter next bar's open
    return out
# ----------------------- STRATEGY B: CLASSICAL FLAG --------------------------
# Trend + flag continuation:
#   1. Uptrend: close > SMA50 > SMA200
#   2. Impulse: +10% or more over the last 20 bars
#   3. Flag: last 5 bars total range < 1.5x ATR (tight consolidation)
#   4. Entry on break of the flag high, stop under the flag low, 2R target
def signals_flag(df):
    out = []
    sma50 = df["Close"].rolling(50).mean()
    sma200 = df["Close"].rolling(200).mean()
    for i in range(210, len(df) - 1):
        if not liquid(df, i):
            continue
        c = df["Close"].iloc[i]
        if not (c > sma50.iloc[i] > sma200.iloc[i]):
            continue
        impulse = c / df["Close"].iloc[i - 20] - 1 > 0.10
        flag_hi = df["High"].iloc[i - 4:i + 1].max()
        flag_lo = df["Low"].iloc[i - 4:i + 1].min()
        tight = (flag_hi - flag_lo) < 1.5 * df["ATR"].iloc[i]
        if impulse and tight:
            # trigger only if next bar trades through the flag high
            nxt = df.iloc[i + 1]
            if nxt["High"] > flag_hi:
                out.append((i + 1, flag_lo - 0.10 * df["ATR"].iloc[i], flag_hi))
    return out
# ----------------------------- TRADE ENGINE ---------------------------------
def run_trades(df, entries, breakout=False):
    trades = []
    last_exit = -1
    for sig in entries:
        if breakout:
            i, stop, trigger = sig
            entry = max(df["Open"].iloc[i], trigger)  # buy-stop fill
        else:
            i, stop = sig
            entry = df["Open"].iloc[i]
        if i <= last_exit or entry <= stop:
            continue
        risk = entry - stop
        target = entry + TARGET_R * risk
        r = None
        for j in range(i, min(i + TIME_STOP, len(df))):
            bar = df.iloc[j]
            if bar["Low"] <= stop:
                r = -1.0
                break
            if bar["High"] >= target:
                r = TARGET_R
                break
        if r is None:  # time stop: exit at close
            j = min(i + TIME_STOP, len(df)) - 1
            r = (df["Close"].iloc[j] - entry) / risk
        trades.append({"date": df.index[i], "r": r})
        last_exit = j
    return trades
# ----------------------------- METRICS --------------------------------------
def report(name, trades):
    if not trades:
        print(f"\n{name}: no trades")
        return
    t = pd.DataFrame(trades).set_index("date").sort_index()
    r = t["r"]
    wins, losses = r[r > 0], r[r <= 0]
    pf = wins.sum() / abs(losses.sum()) if len(losses) else float("inf")
    eq = r.cumsum()
    dd = (eq - eq.cummax()).min()
    print(f"\n===== {name} =====")
    print(f"Trades:        {len(r)}")
    print(f"Win rate:      {len(wins) / len(r):.1%}")
    print(f"Expectancy:    {r.mean():+.2f} R per trade")
    print(f"Profit factor: {pf:.2f}")
    print(f"Total:         {r.sum():+.1f} R   Max drawdown: {dd:.1f} R")
    print("Per year (R):")
    print(r.groupby(r.index.year).agg(["count", "sum"]).round(1).to_string())
# ----------------------------- MAIN ------------------------------------------
if __name__ == "__main__":
    all_ict, all_flag = [], []
    for tk in UNIVERSE:
        df = load(tk)
        if df is None:
            continue
        all_ict += run_trades(df, signals_ict(df))
        all_flag += run_trades(df, signals_flag(df), breakout=True)
        print(f"{tk}: done")
    report("ICT SWING (sweep + displacement)", all_ict)
    report("CLASSICAL FLAG (trend continuation)", all_flag)
    print("\nRead this before trusting anything:")
    print("- Expectancy must be clearly positive AFTER assuming ~0.1R of")
    print("  slippage/commissions per trade. Subtract it mentally.")
    print("- A strategy that only made money in 1-2 years is curve luck.")
    print("  Look for positive R in most years.")
    print("- 100+ trades minimum before the stats mean anything.")
