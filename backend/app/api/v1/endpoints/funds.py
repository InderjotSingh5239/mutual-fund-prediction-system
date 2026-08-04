"""
Mutual fund endpoints: list/search, detail with NAV history, and an
admin-only trigger to run the AMFI NAV sync on demand (in addition
to the scheduled Celery beat task).
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database.session import get_db
from app.repositories.fund_repository import FundRepository
from app.schemas.fund import MutualFundDetail, MutualFundListResponse, MutualFundRead, MutualFundSyncResponse
from app.services.etl_service import ETLService

router = APIRouter()


@router.get("", response_model=MutualFundListResponse, tags=["Funds"])
def list_funds(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(default=None, description="Search by scheme name"),
    db: Session = Depends(get_db),
) -> MutualFundListResponse:
    repo = FundRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.list_funds(skip=skip, limit=page_size, search=search)

    nav_map = repo.get_latest_nav_map([fund.id for fund in items])
    enriched = [_with_nav_change(fund, nav_map) for fund in items]

    return MutualFundListResponse(total=total, page=page, page_size=page_size, items=enriched)


@router.get("/{fund_id}", response_model=MutualFundDetail, tags=["Funds"])
def get_fund(fund_id: uuid.UUID, db: Session = Depends(get_db)) -> MutualFundDetail:
    repo = FundRepository(db)
    fund = repo.get_by_id(fund_id)
    if fund is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund not found")

    nav_map = repo.get_latest_nav_map([fund.id])
    base = _with_nav_change(fund, nav_map)
    return MutualFundDetail(**base.model_dump(), nav_history=fund.nav_history)  # type: ignore[arg-type]


def _with_nav_change(fund, nav_map: dict[uuid.UUID, tuple[float, float | None]]) -> MutualFundRead:
    base = MutualFundRead.model_validate(fund)
    latest, previous = nav_map.get(fund.id, (None, None))
    change_percent = None
    if latest is not None and previous:
        change_percent = round((latest - previous) / previous * 100, 4)
    return base.model_copy(update={"latest_nav": latest, "nav_change_percent": change_percent})


@router.post(
    "/sync/amfi",
    response_model=MutualFundSyncResponse,
    tags=["Funds"],
)
def trigger_amfi_sync(db: Session = Depends(get_db)) -> MutualFundSyncResponse:
    """Manually trigger the AMFI NAV ETL pipeline (admin only)."""
    result = ETLService(db).sync_amfi_nav()
    return MutualFundSyncResponse(**result)
