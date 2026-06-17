"""Source connectors. Each implements the framework.Connector protocol."""

from __future__ import annotations

from ..framework import Connector
from .cz_csu_prices import CzCsuAvgPricesConnector
from .de_nrw_boris import DeNrwBorisConnector
from .global_bis_rppi import GlobalBisRppiConnector
from .hmlr_ppd import HmlrPricePaidConnector
from .jp_mlit_koji import MlitKojiConnector
from .molit_kr import MolitLandTradeConnector
from .tw_moi_land_stats import TwMoiLandStatsConnector
from .tw_taipei_land import TwTaipeiLandPriceConnector


def build_connector(source_code: str) -> Connector:
    """Factory: registry source code → connector instance."""
    if source_code == "uk-hmlr-ppd":
        return HmlrPricePaidConnector()
    if source_code == "kr-molit-land":
        return MolitLandTradeConnector.from_env()
    if source_code == "jp-mlit-koji":
        return MlitKojiConnector.from_env()
    if source_code == "de-nrw-boris":
        return DeNrwBorisConnector()
    if source_code == "tw-moi-land-stats":
        return TwMoiLandStatsConnector()
    if source_code == "tw-taipei-land-price":
        return TwTaipeiLandPriceConnector.from_env()
    if source_code == "global-bis-rppi":
        return GlobalBisRppiConnector()
    if source_code == "cz-csu-avg-prices":
        return CzCsuAvgPricesConnector()
    raise KeyError(f"no connector implemented for source {source_code!r}")


__all__ = [
    "build_connector",
    "CzCsuAvgPricesConnector",
    "DeNrwBorisConnector",
    "GlobalBisRppiConnector",
    "HmlrPricePaidConnector",
    "MlitKojiConnector",
    "MolitLandTradeConnector",
    "TwMoiLandStatsConnector",
    "TwTaipeiLandPriceConnector",
]
