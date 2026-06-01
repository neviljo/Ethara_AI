from sqlalchemy import orm
from sqlalchemy.exc import IntegrityError

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: orm.Session):
        self.db = db

    def create(self, data: ProductCreate) -> Product:
        existing = self.db.query(Product).filter(Product.sku == data.sku).first()
        if existing:
            raise ValueError(f"Product with SKU '{data.sku}' already exists")
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def get_all(self) -> list[Product]:
        return self.db.query(Product).all()

    def get_by_id(self, product_id: int) -> Product | None:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def update(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get_by_id(product_id)
        if not product:
            raise LookupError(f"Product with id {product_id} not found")
        update_data = data.model_dump(exclude_unset=True)
        if "sku" in update_data and update_data["sku"] != product.sku:
            existing = self.db.query(Product).filter(Product.sku == update_data["sku"]).first()
            if existing:
                raise ValueError(f"Product with SKU '{update_data['sku']}' already exists")
        for key, value in update_data.items():
            setattr(product, key, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product_id: int) -> None:
        product = self.get_by_id(product_id)
        if not product:
            raise LookupError(f"Product with id {product_id} not found")
        self.db.delete(product)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Cannot delete product: it is referenced in existing orders")
