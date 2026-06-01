from sqlalchemy import orm
from sqlalchemy.exc import IntegrityError

from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


class OrderService:
    def __init__(self, db: orm.Session):
        self.db = db

    def create(self, data: OrderCreate) -> Order:
        customer = self.db.query(Customer).filter(Customer.id == data.customer_id).first()
        if not customer:
            raise LookupError(f"Customer with id {data.customer_id} not found")

        order = Order(customer_id=data.customer_id)
        self.db.add(order)
        self.db.flush()

        total = 0.0
        for item_data in data.items:
            product = self.db.query(Product).filter(Product.id == item_data.product_id).first()
            if not product:
                raise LookupError(f"Product with id {item_data.product_id} not found")
            if product.quantity_in_stock < item_data.quantity:
                raise ValueError(
                    f"Insufficient stock for product '{product.name}': "
                    f"requested {item_data.quantity}, available {product.quantity_in_stock}"
                )

            product.quantity_in_stock -= item_data.quantity

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item_data.quantity,
                unit_price=float(product.price),
            )
            self.db.add(order_item)
            total += float(product.price) * item_data.quantity

        order.total_amount = total
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_all(self) -> list[Order]:
        return self.db.query(Order).all()

    def get_by_id(self, order_id: int) -> Order | None:
        return self.db.query(Order).filter(Order.id == order_id).first()

    def delete(self, order_id: int) -> None:
        order = self.get_by_id(order_id)
        if not order:
            raise LookupError(f"Order with id {order_id} not found")

        for item in order.items:
            product = self.db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity_in_stock += item.quantity

        self.db.delete(order)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Cannot delete order")
