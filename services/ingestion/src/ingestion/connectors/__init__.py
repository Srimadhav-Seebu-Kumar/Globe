"""Source connectors. Each implements the framework.Connector protocol."""

from __future__ import annotations

from ..framework import Connector
from .hmlr_ppd import HmlrPricePaidConnector
from .molit_kr import MolitLandTradeConnector


def build_connector(source_code: str) -> Connector:
    """Factory: registry source code → connector instance."""
    if source_code == "uk-hmlr-ppd":
        return HmlrPricePaidConnector()
    if source_code == "kr-molit-land":
        return MolitLandTradeConnector.from_env()
    raise KeyError(f"no connector implemented for source {source_code!r}")


__all__ = ["build_connector", "HmlrPricePaidConnector", "MolitLandTradeConnector"]
