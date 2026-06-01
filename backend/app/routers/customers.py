from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import orm

from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(data: CustomerCreate, db: orm.Session = Depends(get_db)):
    service = CustomerService(db)
    try:
        customer = service.create(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return customer


@router.get("", response_model=list[CustomerResponse])
def list_customers(db: orm.Session = Depends(get_db)):
    return CustomerService(db).get_all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: orm.Session = Depends(get_db)):
    service = CustomerService(db)
    customer = service.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer {customer_id} not found")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: orm.Session = Depends(get_db)):
    service = CustomerService(db)
    try:
        service.delete(customer_id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete customer: they have existing orders")
