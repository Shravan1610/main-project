def format_price(value: float, currency: str = "USD") -> str:
    symbol = "$" if currency.upper() == "USD" else ""
    return f"{symbol}{value:,.2f}"


def format_percent(value: float) -> str:
    prefix = "+" if value >= 0 else ""
    return f"{prefix}{value:.2f}%"


def format_market_cap(value: float) -> str:
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    return f"${value:,.0f}"
