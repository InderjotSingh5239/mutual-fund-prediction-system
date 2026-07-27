"""
Repository layer for MutualFund / NAVHistory / AMC.
"""

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session, selectinload

from app.models.amc import AMC
from app.models.mutual_fund import MutualFund
from app.models.nav_history import NAVHistory


class FundRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- AMC ---
    def get_or_create_amc(self, name: str) -> AMC:
        stmt = select(AMC).where(AMC.name == name)
        amc = self.db.execute(stmt).scalar_one_or_none()
        if amc is None:
            amc = AMC(name=name)
            self.db.add(amc)
            self.db.flush()
        return amc

    # --- MutualFund ---
    def get_by_scheme_code(self, scheme_code: str) -> MutualFund | None:
        stmt = select(MutualFund).where(MutualFund.scheme_code == scheme_code)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_id(self, fund_id: uuid.UUID) -> MutualFund | None:
        stmt = (
            select(MutualFund)
            .options(selectinload(MutualFund.nav_history), selectinload(MutualFund.amc))
            .where(MutualFund.id == fund_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def upsert_fund(self, scheme_code: str, scheme_name: str, amc_id: uuid.UUID | None) -> MutualFund:
        fund = self.get_by_scheme_code(scheme_code)
        if fund is None:
            fund = MutualFund(scheme_code=scheme_code, scheme_name=scheme_name, amc_id=amc_id)
            self.db.add(fund)
            self.db.flush()
        elif fund.scheme_name != scheme_name:
            fund.scheme_name = scheme_name
            self.db.add(fund)
            self.db.flush()
        return fund

    def list_funds(
        self, skip: int = 0, limit: int = 50, search: str | None = None
    ) -> tuple[list[MutualFund], int]:
        stmt = select(MutualFund).options(selectinload(MutualFund.amc))
        count_stmt = select(func.count()).select_from(MutualFund)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(MutualFund.scheme_name.ilike(like))
            count_stmt = count_stmt.where(MutualFund.scheme_name.ilike(like))

        total = self.db.execute(count_stmt).scalar_one()
        stmt = stmt.offset(skip).limit(limit).order_by(MutualFund.scheme_name)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    # --- NAV History ---
    def get_latest_nav_map(self, fund_ids: list[uuid.UUID]) -> dict[uuid.UUID, tuple[float, float | None]]:
        """
        Batch-fetch each fund's latest NAV and the one before it, in a single
        query using a window function — avoids an N+1 query per fund when
        rendering a paginated fund list with day-change figures.
        Returns {fund_id: (latest_nav, previous_nav_or_None)}.
        """
        if not fund_ids:
            return {}

        rn = (
            func.row_number()
            .over(partition_by=NAVHistory.fund_id, order_by=NAVHistory.nav_date.desc())
            .label("rn")
        )
        subq = (
            select(NAVHistory.fund_id.label("fund_id"), NAVHistory.nav_value.label("nav_value"), rn)
            .where(NAVHistory.fund_id.in_(fund_ids))
            .subquery()
        )
        stmt = (
            select(subq.c.fund_id, subq.c.nav_value, subq.c.rn)
            .where(subq.c.rn <= 2)
            .order_by(subq.c.fund_id, subq.c.rn)
        )
        rows = self.db.execute(stmt).all()

        per_fund: dict[uuid.UUID, list[float]] = {}
        for fund_id, nav_value, _rn in rows:
            per_fund.setdefault(fund_id, []).append(float(nav_value))

        return {
            fund_id: (values[0], values[1] if len(values) > 1 else None)
            for fund_id, values in per_fund.items()
        }

    def bulk_upsert_nav(self, rows: list[dict]) -> int:
        """
        rows: list of {"fund_id": UUID, "nav_date": date, "nav_value": float}
        Uses Postgres ON CONFLICT DO UPDATE for idempotent incremental loads.
        """
        if not rows:
            return 0

        stmt = pg_insert(NAVHistory).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["fund_id", "nav_date"],
            set_={"nav_value": stmt.excluded.nav_value},
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount or 0

    def get_nav_series(self, fund_id: uuid.UUID, start: date | None = None) -> list[NAVHistory]:
        stmt = select(NAVHistory).where(NAVHistory.fund_id == fund_id)
        if start:
            stmt = stmt.where(NAVHistory.nav_date >= start)
        stmt = stmt.order_by(NAVHistory.nav_date)
        return list(self.db.execute(stmt).scalars().all())
