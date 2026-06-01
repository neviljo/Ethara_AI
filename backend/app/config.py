from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://inventory_user:inventory_pass@localhost:5432/inventory_db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {"env_file": ".env"}


settings = Settings()
