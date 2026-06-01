from sqlalchemy import orm
from sqlalchemy.exc import IntegrityError

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


class CustomerService:
    def __init__(self, db: orm.Session):
        self.db = db

    def create(self, data: CustomerCreate) -> Customer:
        existing = self.db.query(Customer).filter(Customer.email == data.email).first()
        if existing:
            raise ValueError(f"Customer with email '{data.email}' already exists")
        customer = Customer(**data.model_dump())
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer

    def get_all(self) -> list[Customer]:
        return self.db.query(Customer).all()

    def get_by_id(self, customer_id: int) -> Customer | None:
        return self.db.query(Customer).filter(Customer.id == customer_id).first()

    def delete(self, customer_id: int) -> None:
        customer = self.get_by_id(customer_id)
        if not customer:
            raise LookupError(f"Customer with id {customer_id} not found")
        self.db.delete(customer)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Cannot delete customer: they have existing orders")
